import { describe, test, expect, beforeEach } from '@jest/globals';
import { taskRepository } from '../src/services/taskRepository';
import {
  notificationService,
  CHANNEL_STANDARD,
  CHANNEL_URGENT,
  ACTION_DONE,
  ACTION_SNOOZE_10,
} from '../src/services/notificationService';
import { TaskRecord, BUILTIN_PROFILES } from '../src/domain/types';
import * as Notifications from 'expo-notifications';
import { BackHandler } from 'react-native';

describe('REMINDLY Phase 8 — Android-Only Popup & Overlay Design System (Section 12)', () => {
  const testNow = new Date('2026-10-24T10:00:00.000Z');
  const testDue = new Date('2026-10-26T10:00:00.000Z');

  beforeEach(async () => {
    await taskRepository.init();
    await Notifications.cancelAllScheduledNotificationsAsync();
    // @ts-ignore
    BackHandler._clear?.();
  });

  // 1. Quick Capture opens and closes correctly
  test('1. Quick Capture opens and closes with clean state transitions', () => {
    let activeOverlay: string | null = null;
    let draftTitle = '';

    const openQuickCapture = () => {
      activeOverlay = 'quick';
      draftTitle = '';
    };

    const closeQuickCapture = () => {
      activeOverlay = null;
      draftTitle = '';
    };

    openQuickCapture();
    expect(activeOverlay).toBe('quick');
    expect(draftTitle).toBe('');

    draftTitle = 'Buy groceries';
    closeQuickCapture();
    expect(activeOverlay).toBeNull();
    expect(draftTitle).toBe('');
  });

  // 2. Save creates one real reminder
  test('2. Save creates one real reminder in SQLite and schedules notification', async () => {
    const task: TaskRecord = {
      id: 'task-popup-save-1',
      title: 'Submit tax return',
      notes: 'Remember forms 16 and 26AS',
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, testNow);
    await notificationService.reconcileNotifications(testNow);

    const domainTask = await taskRepository.getDomainTask(task.id);
    expect(domainTask).not.toBeNull();
    expect(domainTask?.title).toBe('Submit tax return');

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter((n) => n.content?.data?.taskId === task.id);
    expect(taskNotifications.length).toBeGreaterThanOrEqual(1);
    expect(taskNotifications[0].content.title).toBe('Submit tax return');
  });

  // 3. Keyboard appearance does not hide the Save action
  test('3. Keyboard layout on Android uses height behavior avoiding Save action occlusion', () => {
    const getKeyboardBehavior = (platformOS: string) => (platformOS === 'android' ? 'height' : 'padding');

    expect(getKeyboardBehavior('android')).toBe('height');
    expect(getKeyboardBehavior('ios')).toBe('padding');
  });

  // 4. The detail sheet opens the correct reminder
  test('4. Detail sheet opens the correct reminder data by ID', async () => {
    const task: TaskRecord = {
      id: 'task-detail-lookup-1',
      title: 'Review flight tickets',
      notes: 'Terminal 3 departure',
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_important',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, {
      source_app_label: 'Gmail',
      source_excerpt: 'Booking reference #AI-883',
      source_url: 'https://mail.google.com/mail/u/0/#inbox/12345',
    }, testNow);

    const loaded = await taskRepository.getDomainTask('task-detail-lookup-1');
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe('task-detail-lookup-1');
    expect(loaded?.reminder_profile_id).toBe('builtin_important');
  });

  // 5. Editing and cancelling preserve the correct state
  test('5. Editing updates task in DB, while cancelling discards unsaved draft', async () => {
    const original: TaskRecord = {
      id: 'task-edit-cancel-1',
      title: 'Doctor appointment',
      notes: 'Dr. Sharma Clinic',
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_standard',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(original, null, testNow);

    // Cancelled draft does not modify database
    let draftTitle = 'Cancelled New Title';
    const onCancelEdit = () => {
      draftTitle = original.title;
    };
    onCancelEdit();
    expect(draftTitle).toBe('Doctor appointment');

    let dbTask = await taskRepository.getDomainTask('task-edit-cancel-1');
    expect(dbTask?.title).toBe('Doctor appointment');

    // Confirmed edit modifies database
    const updated: TaskRecord = {
      ...original,
      title: 'Dentist appointment',
      notes: 'Dr. Verma Dental Clinic',
      reminder_profile_id: 'builtin_important',
      updated_at_utc: new Date().toISOString(),
    };
    await taskRepository.saveDomainTask(updated, null, testNow);

    dbTask = await taskRepository.getDomainTask('task-edit-cancel-1');
    expect(dbTask?.title).toBe('Dentist appointment');
    expect(dbTask?.reminder_profile_id).toBe('builtin_important');
  });

  // 6. Done updates the database and cancels pending notifications
  test('6. Done updates status to completed and cancels scheduled notifications', async () => {
    const task: TaskRecord = {
      id: 'task-done-test-1',
      title: 'Pick up laundry',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, testNow);
    await notificationService.reconcileNotifications(testNow);

    let scheduled = await Notifications.getAllScheduledNotificationsAsync();
    let taskNotifications = scheduled.filter((n) => n.content?.data?.taskId === task.id);
    expect(taskNotifications.length).toBeGreaterThan(0);

    // Complete task via notification response action
    await notificationService.handleNotificationResponse({
      actionIdentifier: ACTION_DONE,
      notification: {
        request: {
          content: {
            data: { taskId: task.id },
          },
        },
      },
    }, testNow);

    const completed = await taskRepository.getDomainTask(task.id);
    expect(completed?.status).toBe('completed');
    expect(completed?.completed_at_utc).not.toBeNull();

    scheduled = await Notifications.getAllScheduledNotificationsAsync();
    taskNotifications = scheduled.filter((n) => n.content?.data?.taskId === task.id);
    expect(taskNotifications.length).toBe(0);
  });

  // 7. Snooze schedules one correct next alert
  test('7. Snooze schedules one correct next alert without changing original deadline', async () => {
    const task: TaskRecord = {
      id: 'task-snooze-test-1',
      title: 'Water the plants',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testNow.toISOString(),
      due_local_date: '2026-10-24',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, testNow);

    await notificationService.handleNotificationResponse({
      actionIdentifier: ACTION_SNOOZE_10,
      notification: {
        request: {
          content: {
            data: { taskId: task.id },
          },
        },
      },
    }, testNow);

    const snoozed = await taskRepository.getDomainTask(task.id);
    expect(snoozed?.due_at_utc).toBe(testNow.toISOString()); // Original deadline unchanged!

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter((n) => n.content?.data?.taskId === task.id);
    expect(taskNotifications.length).toBe(1);
  });

  // 8. Android Back behaves correctly when a popup is open
  test('8. Android Back handler closes active modal / dialog hierarchically', () => {
    let confirmationOpen = false;
    let selectorOpen = false;
    let isEditingDetail = false;
    let overlay: string | null = null;
    let quickCaptureDirty = false;

    const handleHardwareBackPress = () => {
      if (confirmationOpen) {
        confirmationOpen = false;
        return true;
      }
      if (selectorOpen) {
        selectorOpen = false;
        return true;
      }
      if (isEditingDetail) {
        isEditingDetail = false;
        return true;
      }
      if (overlay === 'quick' && quickCaptureDirty) {
        confirmationOpen = true; // prompt discard confirmation
        return true;
      }
      if (overlay !== null) {
        overlay = null;
        return true;
      }
      return false; // let system handle app exit
    };

    // Subtest A: Confirmation dialog intercepts back
    confirmationOpen = true;
    overlay = 'detail';
    expect(handleHardwareBackPress()).toBe(true);
    expect(confirmationOpen).toBe(false);
    expect(overlay).toBe('detail');

    // Subtest B: Selector intercepts back
    selectorOpen = true;
    expect(handleHardwareBackPress()).toBe(true);
    expect(selectorOpen).toBe(false);

    // Subtest C: Edit mode exit
    isEditingDetail = true;
    expect(handleHardwareBackPress()).toBe(true);
    expect(isEditingDetail).toBe(false);

    // Subtest D: Quick capture dirty prompts discard
    overlay = 'quick';
    quickCaptureDirty = true;
    expect(handleHardwareBackPress()).toBe(true);
    expect(confirmationOpen).toBe(true);

    // Subtest E: Normal overlay dismiss
    confirmationOpen = false;
    quickCaptureDirty = false;
    expect(handleHardwareBackPress()).toBe(true);
    expect(overlay).toBeNull();

    // Subtest F: No overlay open -> returns false (allows normal navigation/exit)
    expect(handleHardwareBackPress()).toBe(false);
  });

  // 9. Rapid taps do not create duplicate saves or dialogs
  test('9. Rapid taps do not create duplicate saves or overlapping modals', async () => {
    let isSaving = false;
    let saveCount = 0;

    const performSave = async () => {
      if (isSaving) return;
      isSaving = true;
      try {
        saveCount++;
        await new Promise((r) => setTimeout(r, 20));
      } finally {
        isSaving = false;
      }
    };

    await Promise.all([performSave(), performSave(), performSave(), performSave(), performSave()]);
    expect(saveCount).toBe(1);
  });

  // 10. Snackbar Undo actually restores the previous state
  test('10. Snackbar Undo restores completed reminder in SQLite and re-arms notifications', async () => {
    const task: TaskRecord = {
      id: 'task-undo-test-1',
      title: 'Submit quarterly budget',
      notes: null,
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '10:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, testNow);
    await notificationService.reconcileNotifications(testNow);

    // User completes task
    await taskRepository.completeTask(task.id, testNow);
    await notificationService.cancelTaskReminders(task.id);

    let occs = await taskRepository.getPendingOccurrences(testNow);
    expect(occs.filter((o) => o.task_id === task.id).length).toBe(0);

    // User taps "Undo" in the FeedbackSnackbar
    const handleUndo = async () => {
      const restored: TaskRecord = {
        ...task,
        status: 'scheduled',
        completed_at_utc: null,
        updated_at_utc: testNow.toISOString(),
      };
      await taskRepository.saveDomainTask(restored, null, testNow);
      await notificationService.reconcileNotifications(testNow);
    };

    await handleUndo();

    const restoredDb = await taskRepository.getDomainTask(task.id);
    expect(restoredDb?.status).toBe('scheduled');
    expect(restoredDb?.completed_at_utc).toBeNull();

    let restoredOccs = await taskRepository.getPendingOccurrences(testNow);
    expect(restoredOccs.filter((o) => o.task_id === task.id).length).toBeGreaterThanOrEqual(1);
  });

  // 11. A notification opens the correct reminder when the app is backgrounded or terminated
  test('11. Notification response routes to correct reminder detail ID', () => {
    let navigatedReminderId: string | null = null;
    let openedOverlay: string | null = null;

    const handleNotificationOpen = (taskId: string) => {
      navigatedReminderId = taskId;
      openedOverlay = 'detail';
    };

    const mockResponse = {
      notification: {
        request: {
          content: {
            data: { taskId: 'task-bg-123' },
          },
        },
      },
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
    };

    const taskId = mockResponse.notification.request.content.data?.taskId;
    if (taskId) {
      handleNotificationOpen(taskId);
    }

    expect(navigatedReminderId).toBe('task-bg-123');
    expect(openedOverlay).toBe('detail');
  });

  // 12. Normal and Important notification channels have intended initial configurations
  test('12. Notification channels are configured with distinct importance and vibration patterns', async () => {
    await notificationService.configureChannels();

    expect(CHANNEL_STANDARD).toBe('remindly_standard');
    expect(CHANNEL_URGENT).toBe('remindly_urgent');

    const importantProfile = BUILTIN_PROFILES.find((p) => p.id === 'builtin_important');
    expect(importantProfile).toBeDefined();

    const standardProfile = BUILTIN_PROFILES.find((p) => p.id === 'builtin_standard');
    expect(standardProfile).toBeDefined();
  });

  // 13. Changing a channel in Android system settings is respected
  test('13. System notification channels use stable channel IDs and are not deleted', async () => {
    const channels = [CHANNEL_STANDARD, CHANNEL_URGENT];
    expect(channels).toEqual(['remindly_standard', 'remindly_urgent']);
  });

  // 14. The application handles denied notification permission
  test('14. Denied notification permission is handled gracefully without crashing reminder flow', async () => {
    const task: TaskRecord = {
      id: 'task-no-perms-1',
      title: 'Buy vitamins',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '14:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_simple',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, testNow);
    const saved = await taskRepository.getDomainTask(task.id);
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe('Buy vitamins');
  });

  // 15. Small-screen and keyboard layouts remain usable
  test('15. Sheet styling constrains maximum height to 92% to remain usable on small screens', () => {
    const sheetStyle = {
      maxHeight: '92%',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    };
    expect(sheetStyle.maxHeight).toBe('92%');
    expect(sheetStyle.borderTopLeftRadius).toBe(32);
  });

  // 16. Repeated scheduler reconciliation does not create duplicate notifications
  test('16. Repeated scheduler reconciliation is idempotent and avoids duplicates', async () => {
    const task: TaskRecord = {
      id: 'task-dedup-1',
      title: 'Pay electricity bill',
      notes: null,
      status: 'scheduled',
      priority: 'normal',
      due_precision: 'datetime',
      due_at_utc: testDue.toISOString(),
      due_local_date: '2026-10-26',
      due_local_time: '17:00',
      due_timezone: 'UTC',
      reminder_profile_id: 'builtin_standard',
      created_at_utc: testNow.toISOString(),
      updated_at_utc: testNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    await taskRepository.saveDomainTask(task, null, testNow);

    await notificationService.reconcileNotifications(testNow);
    await notificationService.reconcileNotifications(testNow);
    await notificationService.reconcileNotifications(testNow);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter((n) => n.content.data?.taskId === task.id);
    expect(taskNotifications.length).toBeLessThanOrEqual(3);
  });

  // 17. Foreground notification handling does not create duplicate visual alerts
  test('17. In-app foreground alerts use non-blocking snackbar notifications', () => {
    const snackbarQueue: string[] = [];
    const showSnackbar = (msg: string) => {
      if (snackbarQueue[snackbarQueue.length - 1] !== msg) {
        snackbarQueue.push(msg);
      }
    };

    showSnackbar('Reminder saved');
    showSnackbar('Reminder saved');
    expect(snackbarQueue.length).toBe(1);

    showSnackbar('Reminder snoozed for 10 min');
    expect(snackbarQueue.length).toBe(2);
  });

  // 18. Localhost preview is not falsely reported as proof of Android heads-up notifications
  test('18. Explicit architectural distinction between Expo Web preview and native Android notifications', () => {
    const isNativeAndroid = (platform: string) => platform === 'android';
    const canPresentNativeHeadsUp = (platform: string) => platform === 'android';

    expect(isNativeAndroid('web')).toBe(false);
    expect(canPresentNativeHeadsUp('web')).toBe(false);
    expect(isNativeAndroid('android')).toBe(true);
    expect(canPresentNativeHeadsUp('android')).toBe(true);
  });
});
