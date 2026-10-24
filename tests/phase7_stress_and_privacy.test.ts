import { describe, test, expect, beforeEach } from '@jest/globals';
import { taskRepository } from '../src/services/taskRepository';
import { notificationService } from '../src/services/notificationService';
import { TaskRecord, ProfileStageRecord } from '../src/domain/types';
import { materializeOccurrences } from '../src/domain/occurrenceMaterializer';

describe('Phase 7 — Reliability Audit, High-Volume Stress Tests & Privacy Verification', () => {
  const fixedNow = new Date('2026-10-24T10:00:00.000Z');

  beforeEach(async () => {
    await taskRepository.init();
  });

  describe('High-Volume Scale & Stress Test (50 Tasks, 200 Occurrences)', () => {
    test('Materializes and reconciles 50 multi-stage scheduled tasks without memory or duplicate errors', async () => {
      const importantStages: ProfileStageRecord[] = [
        { id: 's1', profile_id: 'builtin_important', sort_order: 1, offset_minutes: -1440, stage_kind: 'heads_up', enabled: 1 },
        { id: 's2', profile_id: 'builtin_important', sort_order: 2, offset_minutes: -240, stage_kind: 'prep', enabled: 1 },
        { id: 's3', profile_id: 'builtin_important', sort_order: 3, offset_minutes: -15, stage_kind: 'urgent', enabled: 1 },
        { id: 's4', profile_id: 'builtin_important', sort_order: 4, offset_minutes: 0, stage_kind: 'deadline', enabled: 1 },
      ];

      const createdTaskIds: string[] = [];

      // 1. Create 50 scheduled tasks spaced out into the future
      for (let i = 1; i <= 50; i++) {
        const taskId = `stress-task-${i}`;
        createdTaskIds.push(taskId);

        // Due 2 to 10 days in the future
        const dueAt = new Date(fixedNow.getTime() + (i + 2) * 24 * 3600 * 1000).toISOString();
        const task: TaskRecord = {
          id: taskId,
          title: `Stress Test Task #${i}: Review contract agreement`,
          notes: `High scale test item ${i}`,
          status: 'scheduled',
          priority: i % 2 === 0 ? 'important' : 'normal',
          due_precision: 'datetime',
          due_at_utc: dueAt,
          due_local_date: '2026-10-30',
          due_local_time: '14:00',
          due_timezone: 'Asia/Kolkata',
          reminder_profile_id: 'builtin_important',
          created_at_utc: fixedNow.toISOString(),
          updated_at_utc: fixedNow.toISOString(),
          completed_at_utc: null,
          archived_at_utc: null,
        };

        await taskRepository.saveDomainTask(task, {
          source_app_label: 'WhatsApp',
          source_excerpt: `Message text for stress item ${i}`,
        }, fixedNow);
      }

      // Verify all 50 tasks have materialized occurrences (4 per task = 200 occurrences)
      let totalOccurrencesCount = 0;
      for (const id of createdTaskIds) {
        const occs = await taskRepository.getOccurrencesForTask(id);
        expect(occs.length).toBe(4);
        totalOccurrencesCount += occs.length;
      }
      expect(totalOccurrencesCount).toBe(200);

      // 2. Perform OS notification reconciliation across 200 occurrences
      const recResult1 = await notificationService.reconcileNotifications(fixedNow);
      expect(recResult1.scheduledCount).toBeGreaterThan(0);

      // 3. Immediately re-run reconciliation — must schedule ZERO duplicates!
      const recResult2 = await notificationService.reconcileNotifications(fixedNow);
      expect(recResult2.scheduledCount).toBe(0);

      // 4. Batch complete 25 tasks and verify cancellation
      for (let i = 0; i < 25; i++) {
        await taskRepository.completeTask(createdTaskIds[i], fixedNow);
      }

      for (let i = 0; i < 25; i++) {
        const occs = await taskRepository.getOccurrencesForTask(createdTaskIds[i]);
        const active = occs.filter((o) => o.status === 'pending' || o.status === 'scheduled');
        expect(active.length).toBe(0);
      }

      // 5. Clean up completed tasks
      const deleted = await taskRepository.clearCompletedTasks();
      expect(deleted).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Privacy & Zero-Exfiltration Audit', () => {
    test('Verifies no cloud sync, login, or third-party telemetry imports exist in domain code', () => {
      const fs = require('fs');
      const domainFiles = fs.readdirSync('src/domain');
      const forbiddenTerms = [
        'firebase',
        'supabase',
        'analytics',
        'amplitude',
        'mixpanel',
        'segment',
        'sentry',
        'api.openai.com',
        'generativelanguage.googleapis.com',
      ];

      for (const f of domainFiles) {
        const content = fs.readFileSync('src/domain/' + f, 'utf8').toLowerCase();
        for (const term of forbiddenTerms) {
          expect(content).not.toContain(term);
        }
      }
    });

    test('Verifies Android manifest configuration does not request invasive permissions', () => {
      const fs = require('fs');
      const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

      const androidConfig = appJson.expo.android || {};
      const permissions: string[] = androidConfig.permissions || [];

      expect(permissions).not.toContain('android.permission.READ_SMS');
      expect(permissions).not.toContain('android.permission.READ_CONTACTS');
      expect(permissions).not.toContain('android.permission.BIND_ACCESSIBILITY_SERVICE');
      expect(permissions).not.toContain('android.permission.BIND_NOTIFICATION_LISTENER_SERVICE');
    });
  });
});
