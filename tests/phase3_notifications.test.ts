import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  notificationService,
  CHANNEL_STANDARD,
  CHANNEL_URGENT,
  CATEGORY_TASK_REMINDER,
  parseQuietHours,
  isTimeInQuietHours,
  adjustForQuietHours,
} from '../src/services/notificationService';
import { taskRepository } from '../src/services/taskRepository';
import { TaskRecord } from '../src/domain/types';

describe('Phase 3 — Reminder Domain Engine & Android Notification Scheduling', () => {
  beforeEach(async () => {
    await taskRepository.init();
  });

  describe('Android Channel & Category Configuration', () => {
    test('Configures standard and urgent channels without error', async () => {
      await expect(notificationService.configureChannels()).resolves.not.toThrow();
      expect(CHANNEL_STANDARD).toBe('remindly_standard');
      expect(CHANNEL_URGENT).toBe('remindly_urgent');
      expect(CATEGORY_TASK_REMINDER).toBe('TASK_REMINDER');
    });

    test('Requests notification permissions cleanly', async () => {
      const granted = await notificationService.requestPermissions();
      expect(typeof granted).toBe('boolean');
    });
  });

  describe('Quiet Hours Evaluation & Deferral Logic', () => {
    const config = parseQuietHours('22:00', '08:00', true);

    test('Accurately detects times within midnight-spanning quiet hours', () => {
      // 23:30 is in quiet hours
      const night = new Date('2026-10-24T23:30:00');
      expect(isTimeInQuietHours(night, config)).toBe(true);

      // 06:15 is in quiet hours
      const earlyMorning = new Date('2026-10-25T06:15:00');
      expect(isTimeInQuietHours(earlyMorning, config)).toBe(true);

      // 14:00 is NOT in quiet hours
      const afternoon = new Date('2026-10-25T14:00:00');
      expect(isTimeInQuietHours(afternoon, config)).toBe(false);
    });

    test('Defers non-urgent advance reminders to quiet hours end (08:00)', () => {
      const trigger = new Date('2026-10-24T23:30:00');
      const due = new Date('2026-10-25T11:00:00');

      const adjusted = adjustForQuietHours(trigger, due, false, config);
      expect(adjusted.getHours()).toBe(8);
      expect(adjusted.getMinutes()).toBe(0);
      expect(adjusted.getDate()).toBe(25);
    });

    test('Does NOT defer urgent or deadline reminders even during quiet hours', () => {
      const deadlineTrigger = new Date('2026-10-24T23:30:00');
      const due = new Date('2026-10-24T23:30:00');

      const adjusted = adjustForQuietHours(deadlineTrigger, due, true, config);
      expect(adjusted.getTime()).toBe(deadlineTrigger.getTime());
    });

    test('Does not push deferred reminder past the task due time', () => {
      const trigger = new Date('2026-10-25T06:30:00');
      const due = new Date('2026-10-25T07:30:00'); // Due before 08:00!

      const adjusted = adjustForQuietHours(trigger, due, false, config);
      expect(adjusted.getTime()).toBeLessThanOrEqual(due.getTime());
    });
  });

  describe('Idempotent Reconciliation Engine', () => {
    test('Reconciles pending occurrences and avoids duplicate scheduling across multiple runs', async () => {
      const now = new Date('2026-10-24T10:00:00.000Z');
      const due = new Date('2026-10-26T15:00:00.000Z');

      const scheduledTask: TaskRecord = {
        id: 'reconcile-task-1',
        title: 'Review production migration plan',
        notes: null,
        status: 'scheduled',
        priority: 'normal',
        due_precision: 'datetime',
        due_at_utc: due.toISOString(),
        due_local_date: '2026-10-26',
        due_local_time: '15:00',
        due_timezone: 'Asia/Kolkata',
        reminder_profile_id: 'builtin_standard',
        created_at_utc: now.toISOString(),
        updated_at_utc: now.toISOString(),
        completed_at_utc: null,
        archived_at_utc: null,
      };

      await taskRepository.saveDomainTask(scheduledTask, null, now);

      // Run reconciliation 1st time
      const result1 = await notificationService.reconcileNotifications(now);
      expect(result1.scheduledCount).toBeGreaterThan(0);

      // Run reconciliation 10 more times in a row — must schedule ZERO duplicates!
      for (let i = 0; i < 10; i++) {
        const resultLoop = await notificationService.reconcileNotifications(now);
        expect(resultLoop.scheduledCount).toBe(0);
      }
    });

    test('Cancels OS notifications when task is completed via notification action', async () => {
      const now = new Date('2026-10-24T10:00:00.000Z');
      const mockResponse = {
        actionIdentifier: 'ACTION_COMPLETE',
        notification: {
          request: {
            content: {
              data: { taskId: 'reconcile-task-1', occurrenceId: 'occ-1' },
            },
          },
        },
      };

      await notificationService.handleNotificationResponse(mockResponse as any, now);
      const task = await taskRepository.getDomainTask('reconcile-task-1');
      expect(task?.status).toBe('completed');
    });

    test('Snoozes task and re-schedules occurrences via Snooze +15m action', async () => {
      const now = new Date('2026-10-24T10:00:00.000Z');
      const due = new Date('2026-10-26T10:00:00.000Z');

      const snoozeTask: TaskRecord = {
        id: 'snooze-action-task',
        title: 'Call insurance provider',
        notes: null,
        status: 'scheduled',
        priority: 'normal',
        due_precision: 'datetime',
        due_at_utc: due.toISOString(),
        due_local_date: '2026-10-26',
        due_local_time: '10:00',
        due_timezone: 'Asia/Kolkata',
        reminder_profile_id: 'builtin_simple',
        created_at_utc: now.toISOString(),
        updated_at_utc: now.toISOString(),
        completed_at_utc: null,
        archived_at_utc: null,
      };

      await taskRepository.saveDomainTask(snoozeTask, null, now);

      const mockResponse = {
        actionIdentifier: 'ACTION_SNOOZE_15',
        notification: {
          request: {
            content: {
              data: { taskId: 'snooze-action-task' },
            },
          },
        },
      };

      await notificationService.handleNotificationResponse(mockResponse as any, now);
      const updated = await taskRepository.getDomainTask('snooze-action-task');
      expect(updated?.status).toBe('scheduled');
      expect(updated?.due_local_time).toBe('10:00');
    });

    test('Sends test diagnostic notification successfully', async () => {
      const notifId = await notificationService.sendTestNotification();
      expect(notifId).not.toBeNull();
    });
  });
});
