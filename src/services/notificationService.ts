import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { taskRepository } from './taskRepository';
import { TaskRecord, ReminderOccurrenceRecord } from '../domain/types';
import { OmniTask } from '../types/task';

export const CHANNEL_STANDARD = 'remindly_standard';
export const CHANNEL_URGENT = 'remindly_urgent';
export const CATEGORY_TASK_REMINDER = 'TASK_REMINDER';
export const ACTION_DONE = 'ACTION_DONE';
export const ACTION_SNOOZE_10 = 'ACTION_SNOOZE_10';

/** Conservative OS scheduling capacity budget (iOS hard limit is 64 local notifications per app) */
export const MAX_PENDING_SCHEDULED_NOTIFICATIONS = 50;

export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export function parseQuietHours(startStr: string, endStr: string, enabled = true): QuietHoursConfig {
  const [sH, sM] = (startStr || '22:00').split(':').map((n) => parseInt(n, 10) || 0);
  const [eH, eM] = (endStr || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
  return {
    enabled,
    startHour: sH,
    startMinute: sM,
    endHour: eH,
    endMinute: eM,
  };
}

export function isTimeInQuietHours(date: Date, config: QuietHoursConfig): boolean {
  if (!config.enabled) return false;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = config.startHour * 60 + config.startMinute;
  const endMinutes = config.endHour * 60 + config.endMinute;

  if (startMinutes > endMinutes) {
    // Spans midnight, e.g. 22:00 -> 08:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function adjustForQuietHours(
  triggerDate: Date,
  dueDate: Date | null,
  isDeadline: boolean,
  config: QuietHoursConfig
): Date {
  if (!config.enabled || isDeadline) {
    return triggerDate;
  }

  if (!isTimeInQuietHours(triggerDate, config)) {
    return triggerDate;
  }

  // Defer to quiet hours end on the target morning
  const deferred = new Date(triggerDate.getTime());
  deferred.setHours(config.endHour, config.endMinute, 0, 0);

  // If trigger was late evening before midnight, deferral is next day morning
  if (deferred.getTime() <= triggerDate.getTime()) {
    deferred.setDate(deferred.getDate() + 1);
  }

  // Safety check: if deferred time is after or equal to due date, keep original trigger date so alert isn't sent after deadline
  if (dueDate && deferred.getTime() >= dueDate.getTime()) {
    return triggerDate;
  }

  return deferred;
}

export class NotificationService {
  private channelsConfigured = false;
  private categoriesConfigured = false;
  // Mock registry for non-native / test environments
  private mockScheduled = new Map<string, any>();
  private reconciliationQueue: Promise<unknown> = Promise.resolve();

  public async configureChannels(): Promise<void> {
    if (this.channelsConfigured && this.categoriesConfigured) return;

    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      try {
        // Standard notification channel: single vibration pulse [0, 160]
        await Notifications.setNotificationChannelAsync(CHANNEL_STANDARD, {
          name: 'Standard Reminders',
          description: 'Notifications for upcoming reminders and standard follow-ups',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 160],
          lightColor: '#38BDF8',
          enableLights: true,
          enableVibrate: true,
        });

        // Important deadline channel: distinctive two-pulse vibration [0, 120, 100, 180]
        await Notifications.setNotificationChannelAsync(CHANNEL_URGENT, {
          name: 'Important Deadline Alerts',
          description: 'Distinctive two-pulse vibration alerts for important task deadlines',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 120, 100, 180],
          lightColor: '#FF6B4A',
          enableLights: true,
          enableVibrate: true,
        });
        // Android channel sound and vibration are immutable once created.
        // Separate channels make the in-app switches effective on Android 8+.
        for (const base of [CHANNEL_STANDARD, CHANNEL_URGENT]) {
          for (const [sound, vibration] of [[false, true], [true, false], [false, false]]) {
            await Notifications.setNotificationChannelAsync(this.channelId(base, sound, vibration), {
              name: `${base === CHANNEL_URGENT ? 'Important' : 'Standard'} Reminders${sound ? '' : ' (silent)'}${vibration ? '' : ' (no vibration)'}`,
              importance: base === CHANNEL_URGENT ? Notifications.AndroidImportance.MAX : Notifications.AndroidImportance.HIGH,
              ...(sound ? {} : { sound: null }),
              enableVibrate: vibration,
              vibrationPattern: vibration ? (base === CHANNEL_URGENT ? [0, 120, 100, 180] : [0, 160]) : [0],
            });
          }
        }
        this.channelsConfigured = true;
      } catch (e) {
        console.warn('[NotificationService] Failed setting native notification channels:', e);
      }
    } else {
      this.channelsConfigured = true;
    }

    if (typeof Notifications.setNotificationCategoryAsync === 'function') {
      try {
        await Notifications.setNotificationCategoryAsync(CATEGORY_TASK_REMINDER, [
          {
            identifier: ACTION_DONE,
            buttonTitle: 'Done',
            // Actions are handled by App's response listener. Starting the app
            // also delivers them when there is no running JavaScript instance.
            options: { opensAppToForeground: true },
          },
          {
            identifier: ACTION_SNOOZE_10,
            buttonTitle: 'Snooze 10 min',
            options: { opensAppToForeground: true },
          },
        ]);
        this.categoriesConfigured = true;
      } catch (e) {
        console.warn('[NotificationService] Failed setting notification categories:', e);
      }
    } else {
      this.categoriesConfigured = true;
    }
  }

  public async hasPermission(): Promise<boolean> {
    try {
      if (typeof Notifications.getPermissionsAsync === 'function') {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
      }
    } catch {
      return false;
    }
    return false;
  }

  private channelId(base: string, sound: boolean, vibration: boolean): string {
    return `${base}${sound ? '' : '_silent'}${vibration ? '' : '_no_vibration'}`;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      if (typeof Notifications.requestPermissionsAsync === 'function') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: true,
          },
        });
        return status === 'granted';
      }
    } catch {
      return false;
    }
    return false;
  }

  public reconcileNotifications(now: Date = new Date()) {
    const operation = this.reconciliationQueue.then(() => this.reconcileNow(now));
    this.reconciliationQueue = operation.catch(() => {});
    return operation;
  }

  private async reconcileNow(now: Date): Promise<{
    scheduledCount: number;
    cancelledCount: number;
    pendingCount: number;
    budgetCapacity: number;
  }> {
    await this.configureChannels();
    const settings = await taskRepository.getSettings();
    const quietConfig = parseQuietHours(
      settings.quietHoursStart,
      settings.quietHoursEnd,
      settings.quietHoursEnabled
    );

    let scheduledCount = 0;
    let cancelledCount = 0;

    // 1. Fetch all pending and scheduled occurrences from SQLite for upcoming triggers
    const occurrences = await taskRepository.getPendingOccurrences(now);
    const domainTasks = await taskRepository.getDomainTasks();
    const taskMap = new Map<string, TaskRecord>();
    for (const t of domainTasks) {
      taskMap.set(t.id, t);
    }

    // 2. Filter active occurrences and apply settings (such as persistent follow-up toggles)
    const eligibleOccurrences: {
      occ: ReminderOccurrenceRecord;
      task: TaskRecord;
      effectiveTrigger: Date;
      isDeadline: boolean;
      isImportantDeadline: boolean;
    }[] = [];

    for (const occ of occurrences) {
      const task = taskMap.get(occ.task_id);
      if (!task || task.status === 'completed' || task.status === 'archived') {
        continue;
      }

      // Check if persistent follow-ups are disabled by user preference
      if (
        settings.persistentFollowupsEnabled === false &&
        occ.stage_label.startsWith('+')
      ) {
        continue;
      }

      const triggerDate = new Date(occ.trigger_at_utc);
      if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      const dueDate = task.due_at_utc ? new Date(task.due_at_utc) : null;
      const isDeadline = occ.stage_label === 'Due';
      const isImportantDeadline = isDeadline && task.priority === 'important';

      const effectiveTrigger = adjustForQuietHours(
        triggerDate,
        dueDate,
        isDeadline,
        quietConfig
      );

      eligibleOccurrences.push({
        occ,
        task,
        effectiveTrigger,
        isDeadline,
        isImportantDeadline,
      });
    }

    // 3. Prioritize by earliest trigger time; prioritize important deadlines if timestamps are equal
    eligibleOccurrences.sort((a, b) => {
      const timeDiff = a.effectiveTrigger.getTime() - b.effectiveTrigger.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.isImportantDeadline && !b.isImportantDeadline) return -1;
      if (!a.isImportantDeadline && b.isImportantDeadline) return 1;
      if (a.isDeadline && !b.isDeadline) return -1;
      if (!a.isDeadline && b.isDeadline) return 1;
      return 0;
    });

    // 4. Enforce conservative scheduling budget (50 max local alerts to comply with iOS 64 limit)
    const toSchedule = eligibleOccurrences.slice(0, MAX_PENDING_SCHEDULED_NOTIFICATIONS);
    const deferredOccurrences = eligibleOccurrences.slice(MAX_PENDING_SCHEDULED_NOTIFICATIONS);
    const toScheduleOccIds = new Set(toSchedule.map((item) => item.occ.id));

    // 5. Fetch all scheduled notifications from the OS to maintain idempotency
    let osScheduled: any[] = [];
    try {
      if (typeof Notifications.getAllScheduledNotificationsAsync === 'function') {
        osScheduled = await Notifications.getAllScheduledNotificationsAsync();
      } else {
        osScheduled = Array.from(this.mockScheduled.values());
      }
    } catch {
      osScheduled = Array.from(this.mockScheduled.values());
    }

    const osScheduledMap = new Map<string, any>();
    for (const item of osScheduled) {
      const occId = item.content?.data?.occurrenceId;
      if (occId) {
        osScheduledMap.set(occId, item);
      }
    }

    // 6. Schedule eligible occurrences within budget
    for (const item of toSchedule) {
      const { occ, task, effectiveTrigger, isImportantDeadline } = item;

      // Android channel selection: distinctive 2-pulse channel for important deadlines, normal channel otherwise
      const playSound = settings.notificationsSoundEnabled !== false;
      const vibrate = settings.notificationsVibrationEnabled !== false;
      const channelId = this.channelId(isImportantDeadline ? CHANNEL_URGENT : CHANNEL_STANDARD, playSound, vibrate);
      const notifId = `notif-${occ.id}`;

      // Respect Lock-Screen Privacy and Sound preferences
      const notifTitle = settings.lockScreenPrivacy
        ? 'Remindly Reminder'
        : task.title;

      const notifBody = settings.lockScreenPrivacy
        ? 'You have a scheduled commitment.'
        : `Reminder (${occ.stage_label}): ${task.notes || task.title}`;

      const scheduleKey = JSON.stringify([effectiveTrigger.toISOString(), notifTitle, notifBody, channelId]);
      const existing = osScheduledMap.get(occ.id);
      if (existing?.content?.data?.scheduleKey === scheduleKey) continue;
      if (existing) {
        await Notifications.cancelScheduledNotificationAsync(existing.identifier);
        this.mockScheduled.delete(existing.identifier);
        cancelledCount++;
      }

      try {
        if (typeof Notifications.scheduleNotificationAsync === 'function') {
          await Notifications.scheduleNotificationAsync({
            identifier: notifId,
            content: {
              title: notifTitle,
              body: notifBody,
              data: {
                taskId: task.id,
                occurrenceId: occ.id,
                stage: occ.stage_label,
                scheduleKey,
              },
              sound: playSound,
              categoryIdentifier: CATEGORY_TASK_REMINDER,
              vibrate: vibrate ? (isImportantDeadline ? [0, 120, 100, 180] : [0, 160]) : [0],
            },
            trigger: (() => {
              const diffSec = Math.max(1, Math.round((effectiveTrigger.getTime() - Date.now()) / 1000));
              if (diffSec <= 3600) {
                return {
                  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                  seconds: diffSec,
                  ...(Platform.OS === 'android' ? { channelId } : {}),
                };
              }
              return {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: effectiveTrigger,
                ...(Platform.OS === 'android' ? { channelId } : {}),
              };
            })(),
          });
        }
        this.mockScheduled.set(notifId, {
          identifier: notifId,
          content: {
            title: notifTitle,
            body: notifBody,
            data: { taskId: task.id, occurrenceId: occ.id, stage: occ.stage_label, scheduleKey },
          },
        });

        // Mark occurrence as scheduled in SQLite
        await taskRepository.updateOccurrenceStatus(occ.id, 'scheduled', notifId);
        scheduledCount++;
      } catch (err) {
        console.warn('[NotificationService] schedule error:', err);
      }
    }

    // 7. Cancel any OS notifications whose task is completed/archived or bumped beyond capacity
    for (const item of osScheduled) {
      const taskId = item.content?.data?.taskId;
      const occId = item.content?.data?.occurrenceId;
      if (taskId && !item.content?.data?.test) {
        const task = taskMap.get(taskId);
        const shouldCancel =
          !task ||
          task.status === 'completed' ||
          task.status === 'archived' ||
          (occId && !toScheduleOccIds.has(occId));

        if (shouldCancel) {
          try {
            if (typeof Notifications.cancelScheduledNotificationAsync === 'function') {
              await Notifications.cancelScheduledNotificationAsync(item.identifier);
            }
            this.mockScheduled.delete(item.identifier);
            cancelledCount++;
          } catch {}
        }
      }
    }

    return {
      scheduledCount,
      cancelledCount,
      pendingCount: deferredOccurrences.length,
      budgetCapacity: MAX_PENDING_SCHEDULED_NOTIFICATIONS,
    };
  }

  public async handleNotificationResponse(
    response: {
      actionIdentifier: string;
      notification: { request: { identifier?: string; content: { data?: any } } };
    },
    now: Date = new Date()
  ): Promise<void> {
    const reqId = response?.notification?.request?.identifier;
    if (reqId && typeof Notifications.dismissNotificationAsync === 'function') {
      try {
        await Notifications.dismissNotificationAsync(reqId);
      } catch {}
    }

    const data = response?.notification?.request?.content?.data;
    if (!data) return;
    if (data.test) return;
    if (!data.taskId) return;

    const { taskId } = data;
    const action = response.actionIdentifier;

    if (action === ACTION_DONE || action === 'ACTION_COMPLETE') {
      await taskRepository.completeTask(taskId, now);
      await this.cancelTaskReminders(taskId);
      await this.reconcileNotifications(now);
    } else if (
      action === ACTION_SNOOZE_10 ||
      action === 'ACTION_SNOOZE_15' ||
      action === 'ACTION_SNOOZE_60'
    ) {
      const minutes =
        action === 'ACTION_SNOOZE_60' ? 60 : action === 'ACTION_SNOOZE_15' ? 15 : 10;
      await taskRepository.snoozeTask(taskId, minutes, now);
      await this.cancelTaskReminders(taskId);
      await this.reconcileNotifications(now);
    }
  }

  public async cancelTaskReminders(taskId: string): Promise<void> {
    try {
      if (typeof Notifications.getAllScheduledNotificationsAsync === 'function') {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const item of scheduled) {
          if (item.content?.data?.taskId === taskId) {
            await Notifications.cancelScheduledNotificationAsync(item.identifier);
          }
        }
      }
    } catch {}

    for (const [key, val] of Array.from(this.mockScheduled.entries())) {
      if (val.content?.data?.taskId === taskId) {
        this.mockScheduled.delete(key);
      }
    }
  }

  public async sendTestNotification(): Promise<string | null> {
    await this.configureChannels();
    const hasPerm = await this.hasPermission();
    if (!hasPerm) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    const id = `notif-test-${Date.now()}`;
    const settings = await taskRepository.getSettings();
    const playSound = settings.notificationsSoundEnabled !== false;

    try {
      if (typeof Notifications.scheduleNotificationAsync === 'function') {
        return await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: 'Remindly test reminder',
            body: 'Notifications and native alert channels are armed and ready.',
            sound: playSound,
            color: '#38BDF8',
            data: { test: true, taskId: id },
            categoryIdentifier: CATEGORY_TASK_REMINDER,
          },
          trigger: {
            type: (Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval') as any,
            seconds: 2,
            ...(Platform.OS === 'android' ? { channelId: this.channelId(CHANNEL_URGENT, playSound, settings.notificationsVibrationEnabled !== false) } : {}),
          },
        });
      }
      this.mockScheduled.set(id, { identifier: id, content: { data: { test: true } } });
      return id;
    } catch (e) {
      console.warn('[NotificationService] sendTestNotification error:', e);
    }

    return null;
  }
}

export const notificationService = new NotificationService();
