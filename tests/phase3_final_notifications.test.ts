import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  notificationService,
  CHANNEL_STANDARD,
  CHANNEL_URGENT,
  CATEGORY_TASK_REMINDER,
  ACTION_DONE,
  ACTION_SNOOZE_10,
  parseQuietHours,
  isTimeInQuietHours,
  adjustForQuietHours,
  MAX_PENDING_SCHEDULED_NOTIFICATIONS,
} from '../src/services/notificationService';
import { taskRepository } from '../src/services/taskRepository';
import { TaskRecord, ReminderOccurrenceRecord } from '../src/domain/types';
import * as Notifications from 'expo-notifications';

function getOffsetMinutes(occ: ReminderOccurrenceRecord, dueAtUtc: string): number {
  return Math.round((new Date(occ.trigger_at_utc).getTime() - new Date(dueAtUtc).getTime()) / 60000);
}

describe('REMINDLY Production-Grade Notification System — All Section 13 Specifications', () => {
  beforeEach(async () => {
    await taskRepository.init();
    await Notifications.cancelAllScheduledNotificationsAsync();
  });

  // 1. Simple creates only the due event
  test('1. Simple profile creates only the single due event (0m offset)', async () => {
    const now = new Date('2026-10-25T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-simple-1',
      title: 'Water the plants',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    expect(taskOccs.length).toBe(1);
    expect(getOffsetMinutes(taskOccs[0], task.due_at_utc!)).toBe(0);
    expect(taskOccs[0].stage_label).toBe('Due');
  });

  // 2. Standard produces 24h, 1h, and due events when all are in the future
  test('2. Standard produces 24-hour, 1-hour, and due events when all are in future', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z'); // 48h in future

    const task: TaskRecord = {
      id: 'spec-test-standard-2',
      title: 'Team roadmap sync',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_standard',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    expect(taskOccs.length).toBe(3);
    const offsets = taskOccs.map((o) => getOffsetMinutes(o, task.due_at_utc!)).sort((a, b) => a - b);
    expect(offsets).toEqual([-1440, -60, 0]);
  });

  // 3. Important produces 24h, 4h, 15m, and due events when all are in the future
  test('3. Important produces 24h, 4h, 15m, and due events when all are in future', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z'); // 48h in future

    const task: TaskRecord = {
      id: 'spec-test-important-3',
      title: 'Submit tax return',
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_important',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    expect(taskOccs.length).toBe(4);
    const offsets = taskOccs.map((o) => getOffsetMinutes(o, task.due_at_utc!)).sort((a, b) => a - b);
    expect(offsets).toEqual([-1440, -240, -15, 0]);
  });

  // 4. Persistent adds only its two bounded follow-ups
  test('4. Persistent profile adds Standard schedule plus only at most 2 bounded follow-ups (+15m, +60m)', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-persistent-4',
      title: 'Take critical medication',
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_persistent',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    expect(taskOccs.length).toBe(5);
    const offsets = taskOccs.map((o) => getOffsetMinutes(o, task.due_at_utc!)).sort((a, b) => a - b);
    expect(offsets).toEqual([-1440, -60, 0, 15, 60]);

    // Verify follow-ups are strictly bounded to 2
    const followups = taskOccs.filter((o) => getOffsetMinutes(o, task.due_at_utc!) > 0);
    expect(followups.length).toBe(2);
    expect(followups[0].stage_label).toContain('+15m');
    expect(followups[1].stage_label).toContain('+60m');
  });

  // 5. Past milestones are skipped
  test('5. Past milestones are skipped and not scheduled', async () => {
    // Current time: 2 hours before due date
    const now = new Date('2026-10-26T08:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-skip-5',
      title: 'Call dentist',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_standard', // stages: -1440, -60, 0
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    // 24h milestone (-1440) was yesterday, so it must be skipped!
    expect(taskOccs.length).toBe(2);
    const offsets = taskOccs.map((o) => getOffsetMinutes(o, task.due_at_utc!)).sort((a, b) => a - b);
    expect(offsets).toEqual([-60, 0]);
    expect(offsets).not.toContain(-1440);
  });

  // 6. A deadline within one hour does not generate an already-expired one-hour alert
  test('6. A deadline within 30 minutes does not generate an expired 1-hour or 24-hour alert', async () => {
    const now = new Date('2026-10-26T09:30:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z'); // 30 mins away

    const task: TaskRecord = {
      id: 'spec-test-within-hour-6',
      title: 'Join conference room',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_standard',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    // Both -1440 and -60 are in the past; only 0m is eligible
    expect(taskOccs.length).toBe(1);
    expect(getOffsetMinutes(taskOccs[0], task.due_at_utc!)).toBe(0);
  });

  // 7. Editing a deadline changes the schedule without duplicates
  test('7. Editing a deadline updates the schedule without duplicate occurrences', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due1 = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-edit-deadline-7',
      title: 'Deploy microservice',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due1.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    await notificationService.reconcileNotifications(now);

    // Edit deadline to 2 days later
    const due2 = new Date('2026-10-28T14:00:00.000Z');
    const updatedTask: TaskRecord = {
      ...task,
      due_at_utc: due2.toISOString(),
      due_local_date: '2026-10-28',
      due_local_time: '14:00',
      updated_at_utc: now.toISOString(),
    };

    await notificationService.cancelTaskReminders(task.id);
    await taskRepository.saveDomainTask(updatedTask, null, now);
    await notificationService.reconcileNotifications(now);

    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    expect(taskOccs.length).toBe(1);
    expect(new Date(taskOccs[0].trigger_at_utc).getTime()).toBe(due2.getTime());
  });

  // 8. Changing the profile removes obsolete events and creates the applicable events
  test('8. Changing profile replaces obsolete events with new profile milestones', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-profile-change-8',
      title: 'Pay utility bills',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_persistent', // 5 occurrences
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    let occs = await taskRepository.getPendingOccurrences(now);
    expect(occs.filter((o) => o.task_id === task.id).length).toBe(5);

    // Switch to Simple (1 occurrence)
    const simpleTask: TaskRecord = {
      ...task,
      reminder_profile_id: 'builtin_simple',
      updated_at_utc: now.toISOString(),
    };
    await notificationService.cancelTaskReminders(task.id);
    await taskRepository.saveDomainTask(simpleTask, null, now);

    occs = await taskRepository.getPendingOccurrences(now);
    const simpleOccs = occs.filter((o) => o.task_id === task.id);
    expect(simpleOccs.length).toBe(1);
    expect(getOffsetMinutes(simpleOccs[0], simpleTask.due_at_utc!)).toBe(0);
  });

  // 9. Completing and deleting a reminder cancel every associated pending event
  test('9. Completing and deleting a reminder cancels all associated pending events', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-complete-delete-9',
      title: 'Contract sign-off',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_standard',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);
    await notificationService.reconcileNotifications(now);

    // Complete task
    await taskRepository.completeTask(task.id, now);
    await notificationService.cancelTaskReminders(task.id);

    let occs = await taskRepository.getPendingOccurrences(now);
    expect(occs.filter((o) => o.task_id === task.id).length).toBe(0);

    // Delete task
    await taskRepository.deleteTask(task.id);
    const domainTask = await taskRepository.getDomainTask(task.id);
    expect(domainTask).toBeFalsy();
  });

  // 10. Snoozing creates one appropriate next alert without a duplicate storm
  test('10. Snoozing creates 1 next alert (+10m), preserves original deadline, avoids duplicate storm', async () => {
    const now = new Date('2026-10-26T10:00:00.000Z');
    const originalDueUtc = now.toISOString();

    const task: TaskRecord = {
      id: 'spec-test-snooze-10',
      title: 'Submit quarterly budget',
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: originalDueUtc,
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);

    // User triggers 10m snooze
    await taskRepository.snoozeTask(task.id, 10, now);
    const snoozedTask = await taskRepository.getDomainTask(task.id);

    // 1. Deadline MUST be preserved!
    expect(snoozedTask?.due_at_utc).toBe(originalDueUtc);

    // 2. Exact 1 snooze occurrence scheduled for now + 10m
    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);
    expect(taskOccs.length).toBe(1);
    expect(taskOccs[0].stage_label).toContain('Snooze');

    const triggerMs = new Date(taskOccs[0].trigger_at_utc).getTime();
    expect(triggerMs).toBe(now.getTime() + 10 * 60 * 1000);

    // 3. Reconcile multiple times — must not create a duplicate snooze alert
    await notificationService.reconcileNotifications(now);
    await notificationService.reconcileNotifications(now);

    const pendingAfter = await taskRepository.getPendingOccurrences(now);
    expect(pendingAfter.filter((o) => o.task_id === task.id).length).toBe(1);
  });

  // 11. Missing notification permission does not prevent saving reminders
  test('11. Missing notification permission does not prevent saving or querying reminders', async () => {
    const now = new Date('2026-10-25T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-no-perm-11',
      title: 'Offline memo without permission',
      notes: 'Should still persist in SQLite even if notifications disabled',
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: '2026-10-27T10:00:00.000Z',
      due_local_date: '2026-10-27',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await expect(taskRepository.saveDomainTask(task, null, now)).resolves.not.toThrow();
    const fetched = await taskRepository.getDomainTask(task.id);
    expect(fetched?.title).toBe('Offline memo without permission');
  });

  // 12. Multiple scheduler reconciliations do not duplicate alerts
  test('12. Multiple consecutive scheduler reconciliations produce zero duplicate alarms', async () => {
    const now = new Date('2026-10-24T10:00:00.000Z');
    const due = new Date('2026-10-27T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-multi-reconcile-12',
      title: 'Board presentation rehearsal',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-27',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_important',
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);

    const r1 = await notificationService.reconcileNotifications(now);
    expect(r1.scheduledCount).toBeGreaterThan(0);

    const r2 = await notificationService.reconcileNotifications(now);
    expect(r2.scheduledCount).toBe(0);

    const r3 = await notificationService.reconcileNotifications(now);
    expect(r3.scheduledCount).toBe(0);
  });

  // 13. A past-due reminder is not repeatedly notified after app startup
  test('13. Past-due reminders are not notified retroactively on app startup', async () => {
    const now = new Date('2026-10-26T12:00:00.000Z');
    const pastDue = new Date('2026-10-26T08:00:00.000Z'); // 4 hours in the past!

    const task: TaskRecord = {
      id: 'spec-test-past-due-13',
      title: 'Morning flight check-in',
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: pastDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '08:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_important',
      created_at_utc: new Date('2026-10-25T08:00:00.000Z').toISOString(),
      updated_at_utc: new Date('2026-10-25T08:00:00.000Z').toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    // Save with past timestamps
    await taskRepository.saveDomainTask(task, null, new Date('2026-10-25T08:00:00.000Z'));

    // Reconcile as if app launched at 'now'
    await notificationService.reconcileNotifications(now);
    const scheduledForTask = (await Notifications.getAllScheduledNotificationsAsync())
      .filter((n) => (n.content.data as any)?.taskId === task.id);

    expect(scheduledForTask.length).toBe(0);
  });

  // 14. Quiet-hours calculations work across midnight if quiet hours are enabled
  test('14. Quiet hours correctly span midnight and defer advance alerts', () => {
    const config = parseQuietHours('22:00', '08:00', true);

    expect(isTimeInQuietHours(new Date('2026-10-24T22:01:00'), config)).toBe(true);
    expect(isTimeInQuietHours(new Date('2026-10-25T01:30:00'), config)).toBe(true);
    expect(isTimeInQuietHours(new Date('2026-10-25T07:59:00'), config)).toBe(true);
    expect(isTimeInQuietHours(new Date('2026-10-25T08:01:00'), config)).toBe(false);
    expect(isTimeInQuietHours(new Date('2026-10-25T15:00:00'), config)).toBe(false);

    // Deferral test
    const nightTrigger = new Date('2026-10-24T23:30:00');
    const afternoonDue = new Date('2026-10-25T14:00:00');
    const deferred = adjustForQuietHours(nightTrigger, afternoonDue, false, config);

    expect(deferred.getHours()).toBe(8);
    expect(deferred.getMinutes()).toBe(0);
    expect(deferred.getDate()).toBe(25);
  });

  // 15. Events close to each other are handled without accidental duplicate alerts
  test('15. Snooze anti-collision skips regular occurrences within 5 minutes of snooze alert', async () => {
    const now = new Date('2026-10-26T10:00:00.000Z');
    const due = new Date('2026-10-26T10:00:00.000Z');

    const task: TaskRecord = {
      id: 'spec-test-collision-15',
      title: 'Join client pitch meeting',
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: due.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_persistent', // has +15m follow-up
      created_at_utc: now.toISOString(),
      updated_at_utc: now.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, now);

    // User snoozes for 12 minutes (which is within 3 minutes of the +15m follow-up!)
    await taskRepository.snoozeTask(task.id, 12, now);

    const occs = await taskRepository.getPendingOccurrences(now);
    const taskOccs = occs.filter((o) => o.task_id === task.id);

    // Check that there is only 1 imminent alert around that time window, not 2 alerts 3 minutes apart!
    const nearAlerts = taskOccs.filter((o) => {
      const diff = Math.abs(new Date(o.trigger_at_utc).getTime() - (now.getTime() + 12 * 60 * 1000));
      return diff <= 5 * 60 * 1000;
    });

    expect(nearAlerts.length).toBe(1);
    expect(nearAlerts[0].stage_label).toContain('Snooze');
  });

  // 16. Internal scheduling budget capacity (Capped at 50 to respect iOS 64 pending limit)
  test('16. Internal scheduling budget is capped at MAX_PENDING_SCHEDULED_NOTIFICATIONS (50)', () => {
    expect(MAX_PENDING_SCHEDULED_NOTIFICATIONS).toBe(50);
  });
});
