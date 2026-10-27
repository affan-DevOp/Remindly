import * as Notifications from 'expo-notifications';
import SecureStore = require('expo-secure-store');
import { MemorySqliteDatabase } from '../src/db/sqliteDatabase';
import { TaskRepository, taskRepository } from '../src/services/taskRepository';
import { NotificationService, adjustForQuietHours, parseQuietHours } from '../src/services/notificationService';
import { captureDateSelection, captureDeadline, futureCaptureTime } from '../src/utils/captureScheduling';
import { isTaskOnSelectedDate } from '../src/utils/taskScheduling';
import { DEFAULT_USER, OmniTask } from '../src/types/task';

function reminder(id = 'regression-reminder'): OmniTask {
  const due = new Date(Date.now() + 2 * 86400000);
  return {
    id, title: 'Regression reminder', timeLabel: '10:00 AM', dateLabel: 'Future',
    status: 'upcoming', source: 'Manual', excerpt: 'Context', profile: 'Persistent',
    createdAt: Date.now(), dueAtUtc: due.toISOString(),
    dueLocalDate: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`,
    dueLocalTime: '10:00', duePrecision: 'datetime',
  };
}

describe('Capture and calendar regressions', () => {
  test('rounding carries minutes into the next hour', () => {
    const target = futureCaptureTime(new Date(2026, 9, 27, 10, 48));
    expect([target.getHours(), target.getMinutes()]).toEqual([11, 0]);
  });

  test('future defaults carry midnight into tomorrow', () => {
    const now = new Date(2026, 9, 27, 23, 54);
    const target = futureCaptureTime(now);
    expect(captureDateSelection(target, now)).toEqual({ mode: 'tomorrow', offset: 1 });
    expect(target.getHours()).toBe(0);
  });

  test('calendar selection preserves dates more than 28 days away', () => {
    const now = new Date(2026, 9, 27, 12);
    const target = new Date(2026, 11, 4, 12);
    const selection = captureDateSelection(target, now);
    const due = captureDeadline(selection.mode, selection.offset, 2, 30, 'PM', now)!;
    expect(due.getFullYear()).toBe(2026);
    expect([due.getMonth(), due.getDate(), due.getHours(), due.getMinutes()]).toEqual([11, 4, 14, 30]);
  });

  test('inbox capture does not acquire a deadline', () => {
    expect(captureDeadline('inbox', 0, 9, 0, 'AM')).toBeNull();
  });

  test('overdue canonical dates remain visible today', () => {
    const task = { ...reminder(), status: 'overdue', dueLocalDate: '2026-10-26' } as OmniTask;
    expect(isTaskOnSelectedDate(task, '2026-10-27', true, false, new Date(2026, 9, 27), 27)).toBe(true);
  });

  test('legacy date labels do not confuse the 2nd with the 20th', () => {
    const task = { ...reminder(), dueLocalDate: undefined, dueAtUtc: undefined, dateLabel: 'Oct 20' };
    expect(isTaskOnSelectedDate(task, '2026-10-02', false, false, new Date(2026, 9, 2), 2)).toBe(false);
  });

  test('daytime quiet hours defer to the same day', () => {
    const adjusted = adjustForQuietHours(new Date(2026, 9, 27, 13), null, false, parseQuietHours('12:00', '15:00'));
    expect([adjusted.getDate(), adjusted.getHours()]).toEqual([27, 15]);
  });
});

describe('Repository and notification regressions', () => {
  beforeEach(async () => {
    await taskRepository.initFallback();
    await taskRepository.logoutUser();
    await taskRepository.updateSetting('quiet_hours_enabled', false);
    await Notifications.cancelAllScheduledNotificationsAsync();
  });
  afterEach(() => jest.restoreAllMocks());

  test('notification actions launch the response handler when the app is closed', async () => {
    const configure = jest.spyOn(require('expo-notifications'), 'setNotificationCategoryAsync');
    await new NotificationService().configureChannels();
    expect(configure).toHaveBeenCalledWith('TASK_REMINDER', expect.arrayContaining([
      expect.objectContaining({ identifier: 'ACTION_DONE', options: { opensAppToForeground: true } }),
      expect.objectContaining({ identifier: 'ACTION_SNOOZE_10', options: { opensAppToForeground: true } }),
    ]));
  });

  test('loading saved users does not mutate defaults or previous settings snapshots', async () => {
    const before = await taskRepository.getSettings();
    await taskRepository.saveUser({ isLoggedIn: true, name: 'Tester', email: 'tester@example.com', avatarInitial: 'T', authProvider: 'email' });
    const signedIn = await taskRepository.getSettings();
    await taskRepository.logoutUser();
    await taskRepository.getSettings();
    expect(DEFAULT_USER.isLoggedIn).toBe(false);
    expect(before.user.isLoggedIn).toBe(false);
    expect(signedIn.user.email).toBe('tester@example.com');
    expect(signedIn.user.isLoggedIn).toBe(true);
  });

  test('returning users keep both their old reminders and newly captured guest reminders', async () => {
    await taskRepository.saveTask(reminder('existing'), 'returning@example.com');
    await taskRepository.saveTask(reminder('new-guest'), 'local_guest');
    await taskRepository.saveUser({ isLoggedIn: true, name: 'Returning', email: 'returning@example.com', avatarInitial: 'R', authProvider: 'email' });
    const ids = (await taskRepository.getAllTasks()).map((task) => task.id);
    expect(ids).toEqual(expect.arrayContaining(['existing', 'new-guest']));
    expect((await taskRepository.getSettings()).hasSeenOnboarding).toBe(true);
  });

  test('snoozing preserves canonical deadline date and time', async () => {
    const task = reminder();
    await taskRepository.saveTask(task);
    await taskRepository.snoozeTask(task.id, 15);
    const domain = await taskRepository.getDomainTask(task.id);
    expect(domain?.due_at_utc).toBe(task.dueAtUtc);
    expect(domain?.due_local_time).toBe('10:00');
    const visible = (await taskRepository.getAllTasks()).find((item) => item.id === task.id)!;
    expect(visible.timeLabel).toBe('In 15 min');
    expect(visible.dueLocalTime).toBe('10:00');
  });

  test('snoozing an inbox item schedules it and preserves its context', async () => {
    const task = { ...reminder(), status: 'inbox', dueAtUtc: undefined, dueLocalDate: undefined, dueLocalTime: undefined } as OmniTask;
    await taskRepository.saveTask(task);
    await taskRepository.snoozeTask(task.id, 15);
    const domain = await taskRepository.getDomainTask(task.id);
    expect(domain?.status).toBe('scheduled');
    expect(domain?.due_at_utc).toBeTruthy();
    expect(domain?.due_local_time).toMatch(/^\d{2}:\d{2}$/);
  });

  test('turning off persistent follow-ups still schedules explicitly snoozed reminders', async () => {
    const task = reminder();
    await taskRepository.saveTask(task);
    await taskRepository.snoozeTask(task.id, 15);
    await taskRepository.updateSetting('persistent_followups_enabled', false);
    await new NotificationService().reconcileNotifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter((item) => item.content.data?.taskId === task.id);
    expect(ours.some((item) => String(item.content.data?.stage).startsWith('Snooze'))).toBe(true);
    expect(ours.some((item) => String(item.content.data?.stage).startsWith('+'))).toBe(false);
  });

  test('changing privacy, sound and vibration updates existing OS notifications without duplicates', async () => {
    const task = reminder();
    await taskRepository.saveTask(task);
    const service = new NotificationService();
    await service.reconcileNotifications();
    await taskRepository.updateSetting('lock_screen_privacy', true);
    await taskRepository.updateSetting('notifications_sound_enabled', false);
    await taskRepository.updateSetting('notifications_vibration_enabled', false);
    await service.reconcileNotifications();
    const ours = (await Notifications.getAllScheduledNotificationsAsync()).filter((item) => item.content.data?.taskId === task.id);
    expect(ours.length).toBeGreaterThan(0);
    expect(new Set(ours.map((item) => item.identifier)).size).toBe(ours.length);
    for (const notification of ours) {
      expect(notification.content.title).toBe('Remindly Reminder');
      expect(notification.content.sound).toBe(false);
      expect((notification.trigger as any).channelId).toContain('_silent_no_vibration');
    }
    expect((await service.reconcileNotifications()).scheduledCount).toBe(0);
  });

  test('background reconciliation does not cancel an armed test notification', async () => {
    const service = new NotificationService();
    const id = await service.sendTestNotification();
    await service.reconcileNotifications();
    expect((await Notifications.getAllScheduledNotificationsAsync()).some((item) => item.identifier === id)).toBe(true);
  });

  test('fallback persistence restores pending occurrences and never reseeds deleted sample tasks', async () => {
    let backup: string | null = null;
    jest.spyOn(SecureStore, 'setItemAsync').mockImplementation(async (_key, value) => { backup = value; });
    jest.spyOn(SecureStore, 'getItemAsync').mockImplementation(async () => backup);
    const first = new TaskRepository();
    await first.initFallback();
    await first.saveTask(reminder('persisted'));
    for (const task of await first.getAllTasks()) {
      if (task.id !== 'persisted') await first.deleteTask(task.id);
    }
    const second = new TaskRepository();
    await second.initFallback();
    expect((await second.getAllTasks()).map((item) => item.id)).toEqual(['persisted']);
    expect((await second.getOccurrencesForTask('persisted')).length).toBeGreaterThan(0);
    await second.deleteTask('persisted');
    const third = new TaskRepository();
    await third.initFallback();
    expect(await third.getAllTasks()).toEqual([]);
  });

  test('fallback transactions roll back failed changes', async () => {
    const db = new MemorySqliteDatabase();
    await expect(db.transaction(async (tx) => {
      await tx.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['example', 'changed']);
      throw new Error('Simulated write failure');
    })).rejects.toThrow('Simulated write failure');
    expect(await db.getAll('SELECT * FROM app_settings;')).toEqual([]);
  });
});
