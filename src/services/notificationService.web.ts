/**
 * Web Notification Service for Remindly
 */
import { OmniTask } from '../types/task';

export const CHANNEL_STANDARD = 'remindly_standard';
export const CHANNEL_URGENT = 'remindly_urgent';

export class NotificationService {
  public async configureChannels(): Promise<void> {
    // No-op on web
  }

  public async requestPermissions(): Promise<boolean> {
    return false;
  }

  public async hasPermission(): Promise<boolean> {
    return false;
  }

  public async reconcileNotifications(): Promise<{ scheduledCount: number; cancelledCount: number }> {
    return { scheduledCount: 0, cancelledCount: 0 };
  }

  public async scheduleTaskReminder(task: OmniTask, triggerSeconds = 5): Promise<string | null> {
    console.log('[NotificationService Web] Scheduled reminder for:', task.title, 'in', triggerSeconds, 'seconds');
    return 'web-notif-' + Date.now();
  }

  public async snoozeTaskReminder(task: OmniTask, minutes: number): Promise<string | null> {
    console.log('[NotificationService Web] Snoozed reminder for:', task.title, 'by', minutes, 'min');
    return 'web-snooze-' + Date.now();
  }

  public async cancelTaskReminders(taskId: string): Promise<void> {
    console.log('[NotificationService Web] Cancelled reminder for task:', taskId);
  }

  public async sendTestNotification(): Promise<string | null> {
    console.log('[NotificationService Web] Sent test notification');
    return 'web-test-reminder';
  }
}

export const notificationService = new NotificationService();
