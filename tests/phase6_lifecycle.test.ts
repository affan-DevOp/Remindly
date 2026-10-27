import { describe, test, expect, beforeEach } from '@jest/globals';
import { shareIngestService } from '../src/services/shareIngestService';
import { parseCaptureText } from '../src/domain/nlpParser';
import { taskRepository } from '../src/services/taskRepository';
import { notificationService } from '../src/services/notificationService';
import { TaskRecord, BUILTIN_PROFILES } from '../src/domain/types';

describe('Phase 6 — End-to-End Task Lifecycle, Profile Studio & Actions', () => {
  const fixedNow = new Date('2026-10-24T10:00:00.000Z');

  beforeEach(async () => {
    await taskRepository.init();
  });

  test('Full end-to-end lifecycle: Share Ingest -> NLP Parse -> Save -> Occurrences -> Schedule -> Snooze -> Complete -> Cancel', async () => {
    // 1. Share Ingest from external Android app (WhatsApp forwarded message)
    const rawSharedText = '[14:20, 24/10/2026] Rahul: Review the quarterly audit document https://docs.google.com/audit123 tomorrow at 3pm';
    const normalized = shareIngestService.normalizePayload(rawSharedText);

    expect(normalized).not.toBeNull();
    expect(normalized?.source).toBe('WhatsApp');
    expect(normalized?.sourceUrl).toBe('https://docs.google.com/audit123');

    // 2. Local deterministic NLP Date Parsing (100% on-device)
    const parseResult = parseCaptureText(normalized!.rawText, fixedNow);
    expect(parseResult.kind).toBe('datetime');
    expect(parseResult.primaryCandidate).not.toBeNull();
    expect(parseResult.suggestedTitle).toBe('Rahul: Review the quarterly audit document');

    // 3. User Confirmation & Persistence into SQLite
    const taskId = 'lifecycle-task-' + Date.now();
    const scheduledDue = parseResult.primaryCandidate!.instantUtc;

    const domainTask: TaskRecord = {
      id: taskId,
      title: parseResult.suggestedTitle,
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: scheduledDue,
      due_local_date: parseResult.primaryCandidate!.localDate,
      due_local_time: parseResult.primaryCandidate!.localTime,
      due_timezone: 'Asia/Kolkata',
      reminder_profile_id: 'builtin_important',
      created_at_utc: fixedNow.toISOString(),
      updated_at_utc: fixedNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(domainTask, {
      source_app_label: normalized!.source,
      source_url: normalized!.sourceUrl,
      source_excerpt: normalized!.rawText,
      sender_label: normalized!.sender,
    }, fixedNow);

    // 4. Occurrence Materialization Verification
    const occurrences = await taskRepository.getOccurrencesForTask(taskId);
    expect(occurrences.length).toBe(4); // Important profile has 4 stages: -24h, -4h, -15m, Due
    expect(occurrences.some((o) => o.stage_label === 'Due')).toBe(true);

    // 5. OS Notification Reconciliation
    const reconciliation = await notificationService.reconcileNotifications(fixedNow);
    expect(reconciliation.scheduledCount).toBeGreaterThan(0);

    // 6. Action: Snooze by 15 minutes
    const snoozeNow = new Date('2026-10-25T15:00:00.000Z'); // at due time
    await taskRepository.snoozeTask(taskId, 15, snoozeNow);
    const snoozedTask = await taskRepository.getDomainTask(taskId);
    expect(snoozedTask?.due_local_time).toBe('15:00');

    // Occurrences should be rescheduled
    const snoozedOccurrences = await taskRepository.getOccurrencesForTask(taskId);
    expect(snoozedOccurrences.length).toBeGreaterThan(0);

    // 7. Action: Complete Task
    await taskRepository.completeTask(taskId, snoozeNow);
    const completedTask = await taskRepository.getDomainTask(taskId);
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.completed_at_utc).not.toBeNull();

    // 8. Cancellation of remaining occurrences
    const finalOccurrences = await taskRepository.getOccurrencesForTask(taskId);
    const activeOccurrences = finalOccurrences.filter((o) => o.status === 'pending' || o.status === 'scheduled');
    expect(activeOccurrences.length).toBe(0);

    // 9. App Restart Reconciliation (running reconciliation after completion cancels OS notifications)
    const restartReconciliation = await notificationService.reconcileNotifications(snoozeNow);
    expect(restartReconciliation.scheduledCount).toBe(0);
  });

  describe('Settings & Profile Studio Utilities', () => {
    test('Reads and updates quiet hours and default profile', async () => {
      await taskRepository.updateSetting('quiet_hours_enabled', true);
      await taskRepository.updateSetting('quiet_hours_start', '23:00');
      await taskRepository.updateSetting('quiet_hours_end', '07:00');
      await taskRepository.updateSetting('default_profile_id', 'builtin_important');

      const settings = await taskRepository.getSettings();
      expect(settings.quietHoursEnabled).toBe(true);
      expect(settings.quietHoursStart).toBe('23:00');
      expect(settings.quietHoursEnd).toBe('07:00');
      expect(settings.defaultProfile).toBe('Important');
    });

    test('Clears completed tasks from database', async () => {
      // Create a completed task
      const completedTask: TaskRecord = {
        id: 'completed-cleanup-task',
        title: 'Old done task',
        notes: null,
        status: 'completed',
        priority: 'normal',
        due_precision: 'none',
        due_at_utc: null,
        due_local_date: null,
        due_local_time: null,
        due_timezone: 'Asia/Kolkata',
        reminder_profile_id: 'builtin_simple',
        created_at_utc: fixedNow.toISOString(),
        updated_at_utc: fixedNow.toISOString(),
        completed_at_utc: fixedNow.toISOString(),
        archived_at_utc: null,
      };

      await taskRepository.saveDomainTask(completedTask, null, fixedNow);
      const deletedCount = await taskRepository.clearCompletedTasks();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      const check = await taskRepository.getDomainTask('completed-cleanup-task');
      expect(check).toBeNull();
    });

    test('Generates valid JSON backup export containing tasks, profiles, and settings', async () => {
      const backupJson = await taskRepository.exportBackupJson();
      const backup = JSON.parse(backupJson);

      expect(backup.version).toBe(1);
      expect(backup.exported_at).toBeDefined();
      expect(Array.isArray(backup.tasks)).toBe(true);
      expect(Array.isArray(backup.profiles)).toBe(true);
      expect(Array.isArray(backup.settings)).toBe(true);
    });
  });
});
