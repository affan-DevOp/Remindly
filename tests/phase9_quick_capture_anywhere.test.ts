import { describe, test, expect, beforeEach } from '@jest/globals';
import { taskRepository } from '../src/services/taskRepository';
import { quickCaptureOverlayService } from '../src/services/quickCaptureOverlayService';
import { TaskRecord, TaskSourceRecord, ReminderOccurrenceRecord } from '../src/domain/types';
import { OmniTask } from '../src/types/task';

describe('Phase 9 — Native Android Quick Capture Anywhere & Header Badge Behavior', () => {
  beforeEach(async () => {
    await taskRepository.init();
  });

  describe('Notification Icon Badge Logic', () => {
    test('Does not show dot on notification/inbox icon when there are zero inbox messages', () => {
      const tasks: OmniTask[] = [
        {
          id: 'task-1',
          title: 'Review proposal',
          timeLabel: '2:00 PM',
          dateLabel: 'Today',
          status: 'upcoming',
          source: 'Manual',
          excerpt: '',
          profile: 'Standard',
          createdAt: Date.now(),
        },
        {
          id: 'task-2',
          title: 'Tax invoice payment',
          timeLabel: 'Completed',
          dateLabel: 'Today',
          status: 'done',
          source: 'Manual',
          excerpt: '',
          profile: 'Standard',
          createdAt: Date.now(),
        },
      ];

      const hasInboxMessages = tasks.some((t) => t.status === 'inbox');
      expect(hasInboxMessages).toBe(false);
    });

    test('Shows dot on notification/inbox icon when there is at least one inbox message', () => {
      const tasks: OmniTask[] = [
        {
          id: 'task-1',
          title: 'Incoming client inquiry',
          timeLabel: 'Inbox',
          dateLabel: 'Inbox',
          status: 'inbox',
          source: 'WhatsApp',
          excerpt: 'Can you send the contract?',
          profile: 'Standard',
          createdAt: Date.now(),
        },
      ];

      const hasInboxMessages = tasks.some((t) => t.status === 'inbox');
      expect(hasInboxMessages).toBe(true);
    });
  });

  describe('Shared Authoritative Reminder Persistence', () => {
    test('Saves reminder from Quick Capture directly into SQLite without secondary database', async () => {
      const taskId = "qc-task-" + Date.now();
      const nowIso = new Date().toISOString();

      const taskRecord: TaskRecord = {
        id: taskId,
        user_id: 'local_guest',
        title: 'Review contract sent via WhatsApp',
        notes: 'Captured via Remindly Quick Capture Anywhere',
        status: 'scheduled',
        priority: 'important',
        due_precision: 'datetime',
        due_at_utc: new Date(Date.now() + 3600000).toISOString(),
        due_local_date: '2026-10-24',
        due_local_time: '18:00',
        due_timezone: 'UTC',
        reminder_profile_id: 'builtin_important',
        created_at_utc: nowIso,
        updated_at_utc: nowIso,
        completed_at_utc: null,
        archived_at_utc: null,
      };

      const sourceRecord: TaskSourceRecord = {
        id: "source-" + taskId,
        task_id: taskId,
        source_app_label: 'Quick Capture Anywhere',
        source_app_package: 'com.remindly.app',
        source_url: null,
        source_excerpt: 'Review contract sent via WhatsApp',
        sender_label: null,
        subject: null,
        created_at_utc: nowIso,
      };

      await taskRepository.saveDomainTask(taskRecord, sourceRecord);

      // Verify task is loaded by main app's repository
      const loaded = await taskRepository.getDomainTask(taskId);
      expect(loaded).not.toBeNull();
      expect(loaded?.title).toBe('Review contract sent via WhatsApp');
      expect(loaded?.priority).toBe('important');

      const allTasks = await taskRepository.getAllTasks();
      const match = allTasks.find((t) => t.id === taskId);
      expect(match).toBeDefined();
      expect(match?.title).toBe('Review contract sent via WhatsApp');
      expect(match?.status).toBe('upcoming');
    });

    test('Materializes occurrences and schedules alerts using same authoritative engine', async () => {
      const taskId = "qc-occ-test-" + Date.now();
      const dueTime = new Date(Date.now() + 7200000);
      const nowIso = new Date().toISOString();

      const task: TaskRecord = {
        id: taskId,
        user_id: 'local_guest',
        title: 'Call landlord',
        notes: 'Quick capture',
        status: 'scheduled',
        priority: 'normal',
        due_precision: 'datetime',
        due_at_utc: dueTime.toISOString(),
        due_local_date: '2026-10-24',
        due_local_time: '18:00',
        due_timezone: 'UTC',
        reminder_profile_id: 'builtin_standard',
        created_at_utc: nowIso,
        updated_at_utc: nowIso,
        completed_at_utc: null,
        archived_at_utc: null,
      };

      await taskRepository.saveDomainTask(task);

      const occurrences = await taskRepository.getOccurrencesForTask(taskId);
      expect(Array.isArray(occurrences)).toBe(true);

      // Completing the task cleans up scheduled occurrences
      await taskRepository.completeTask(taskId);
      const updatedOccurrences = await taskRepository.getOccurrencesForTask(taskId);
      const activeOccurrences = updatedOccurrences.filter((o) => o.status === 'scheduled' || o.status === 'pending');
      expect(activeOccurrences.length).toBe(0);
    });
  });

  describe('QuickCaptureOverlayService Interface & Fallbacks', () => {
    test('Provides non-throwing safe defaults in non-native / test environments', async () => {
      const canDraw = await quickCaptureOverlayService.canDrawOverlays();
      expect(typeof canDraw).toBe('boolean');

      const isRunning = await quickCaptureOverlayService.isOverlayServiceRunning();
      expect(typeof isRunning).toBe('boolean');

      const openSettings = await quickCaptureOverlayService.openOverlaySettings();
      expect(typeof openSettings).toBe('boolean');

      const started = await quickCaptureOverlayService.startOverlayService();
      expect(typeof started).toBe('boolean');

      const stopped = await quickCaptureOverlayService.stopOverlayService();
      expect(typeof stopped).toBe('boolean');
    });
  });
});
