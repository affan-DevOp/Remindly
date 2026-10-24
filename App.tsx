import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-expo';
import { CLERK_PUBLISHABLE_KEY, tokenCache } from './src/config/clerk';

WebBrowser.maybeCompleteAuthSession();
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from './src/theme';
import RemindlyDesignReference from './src/components/RemindlyDesignReference';
import { OmniTask, TaskSource, UserProfile, AppSettings, DEFAULT_USER, DEFAULT_SETTINGS } from './src/types/task';
import { taskRepository } from './src/services/taskRepository';
import { notificationService } from './src/services/notificationService';
import { shareIngestService } from './src/services/shareIngestService';
import { C } from './src/theme/colors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function MainApplication() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const clerk = useClerk();
  const [tasks, setTasks] = useState<OmniTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | undefined>();
  const [retryVersion, setRetryVersion] = useState(0);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean | undefined>(undefined);
  const [initialView, setInitialView] = useState<'app' | 'onboarding'>('app');
  const [sharedText, setSharedText] = useState<string | undefined>(undefined);
  const [sharedSource, setSharedSource] = useState<TaskSource | undefined>(undefined);
  const [sharedSourceUrl, setSharedSourceUrl] = useState<string | undefined>(undefined);
  const [sharedSourceSubject, setSharedSourceSubject] = useState<string | undefined>(undefined);
  const [sharedSourceSender, setSharedSourceSender] = useState<string | undefined>(undefined);
  const [sharedTitle, setSharedTitle] = useState<string | undefined>(undefined);
  const [shareRevision, setShareRevision] = useState(0);
  const [notificationTaskId, setNotificationTaskId] = useState<string | undefined>();
  const [notificationRevision, setNotificationRevision] = useState(0);
  const handledNotificationKeys = useRef(new Set<string>());

  // 1. Initial Load: SQLite Tasks + Settings / User Auth + Notification Channels + Share Intents
  useEffect(() => {
    let mounted = true;
    setBootstrapError(undefined);

    async function bootstrap() {
      try {
        // Prepare notification channels without prompting before the user creates a reminder.
        await notificationService.configureChannels();
        const permissionState = await notificationService.hasPermission();
        if (mounted) setNotificationsAllowed(permissionState);

        // Load Settings and User Profile from SQLite
        const settings = await taskRepository.getSettings();
        const activeUserId = settings.user.isLoggedIn ? (settings.user.email || 'local_guest') : 'local_guest';
        taskRepository.setCurrentUserId(activeUserId);

        if (mounted) {
          setUser(settings.user);
          setSettings(settings);
          // Show onboarding only on first launch or when logged out
          const isFirstTimeOrLoggedOut = !settings.user.isLoggedIn && !settings.hasSeenOnboarding;
          setInitialView(isFirstTimeOrLoggedOut ? 'onboarding' : 'app');
        }

        // Load Persistent Tasks for active user from SQLite
        const loadedTasks = await taskRepository.getAllTasks(activeUserId);
        if (mounted) {
          setTasks(loadedTasks);
          setLoading(false);
        }
        try {
          await notificationService.reconcileNotifications();
        } catch (notificationError) {
          console.warn('[Remindly] Could not reconcile reminders during startup:', notificationError);
        }

        // Check for cold-start share intent or deep link
        const sharePayload = await shareIngestService.getInitialShareIntent();
        if (sharePayload && mounted && shareIngestService.shouldProcess(sharePayload.ingestKey)) {
          setSharedText(sharePayload.rawText);
          setSharedSource(sharePayload.source);
          setSharedSourceUrl(sharePayload.sourceUrl);
          setSharedSourceSubject(sharePayload.subject);
          setSharedSourceSender(sharePayload.sender);
          setSharedTitle(sharePayload.suggestedTitle);
          setShareRevision((revision) => revision + 1);
        }
      } catch (err) {
        console.warn('[Remindly] Bootstrap primary error:', err);
        try {
          console.warn('[Remindly] Recovering using fallback storage...');
          await taskRepository.initFallback();
          const fallbackSettings = await taskRepository.getSettings();
          const fallbackTasks = await taskRepository.getAllTasks('local_guest');
          if (mounted) {
            setUser(fallbackSettings.user);
            setSettings(fallbackSettings);
            setTasks(fallbackTasks);
            setLoading(false);
            setBootstrapError(undefined);
          }
          return;
        } catch (recoveryErr) {
          console.error('[Remindly] Safe mode recovery failed:', recoveryErr);
        }

        if (mounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setBootstrapError(`Remindly could not load storage: ${msg}`);
          setLoading(false);
        }
      }
    }

    bootstrap();

    // Warm-start listener for incoming share intent URLs
    const sub = Linking.addEventListener('url', ({ url }) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed.queryParams?.text || parsed.queryParams?.title || parsed.queryParams?.url || parsed.queryParams?.subject || parsed.queryParams?.package || parsed.queryParams?.caller) {
          const text = String(parsed.queryParams.text || parsed.queryParams.title || '');
          const linkUrl = parsed.queryParams.url ? String(parsed.queryParams.url) : undefined;
          const subject = parsed.queryParams.subject ? String(parsed.queryParams.subject) : undefined;
          const caller = parsed.queryParams.package || parsed.queryParams.caller || parsed.queryParams['android.intent.extra.PACKAGE_NAME'] || parsed.queryParams['android.intent.extra.REFERRER']
            ? String(parsed.queryParams.package || parsed.queryParams.caller || parsed.queryParams['android.intent.extra.PACKAGE_NAME'] || parsed.queryParams['android.intent.extra.REFERRER'])
            : undefined;
          const normalized = shareIngestService.normalizePayload(text, linkUrl, undefined, subject, caller);
          if (normalized && shareIngestService.shouldProcess(normalized.ingestKey)) {
            setSharedText(normalized.rawText);
            setSharedSource(normalized.source);
            setSharedSourceUrl(normalized.sourceUrl);
            setSharedSourceSubject(normalized.subject);
            setSharedSourceSender(normalized.sender);
            setSharedTitle(normalized.suggestedTitle);
            setShareRevision((revision) => revision + 1);
          }
        }
      } catch (e) {
        console.warn('[Remindly] Warm intent parsing error:', e);
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [retryVersion]);

  useEffect(() => {
    let active = true;
    const refreshPermissionAndSchedules = async () => {
      const allowed = await notificationService.hasPermission();
      if (!active) return;
      setNotificationsAllowed(allowed);
      if (allowed) await notificationService.reconcileNotifications();
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermissionAndSchedules();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const processNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    try {
      const notification = response.notification;
      const data = (notification.request.content.data || {}) as { taskId?: string; occurrenceId?: string; test?: boolean };
      const responseKey = `${notification.request.identifier}:${response.actionIdentifier}`;
      if (handledNotificationKeys.current.has(responseKey)) return;
      handledNotificationKeys.current.add(responseKey);

      // Dismiss from Android notification shade
      try {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      } catch {}

      // Handle test reminder notification click
      if (data?.test) {
        return;
      }

      const taskId = data?.taskId;
      if (!taskId) return;

      if (response.actionIdentifier === 'ACTION_DONE' || response.actionIdentifier === 'ACTION_COMPLETE' || response.actionIdentifier.startsWith('ACTION_SNOOZE_')) {
        await notificationService.handleNotificationResponse(response);
        const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
        setTasks(await taskRepository.getAllTasks(activeUserId));
        return;
      }

      setNotificationTaskId(taskId);
      setNotificationRevision((revision) => revision + 1);
    } catch (error) {
      console.warn('[Remindly] Could not apply notification action:', error);
    }
  }, [user]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void processNotificationResponse(response);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) void processNotificationResponse(response);
    }).catch((error) => console.warn('[Remindly] Could not read notification response:', error));
    return () => subscription.remove();
  }, [processNotificationResponse]);

  // 2. Persistent Save Callback: SQLite + Notification Scheduling
  const handleCaptureSaved = useCallback(async (task: OmniTask) => {
    try {
      const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
      task.userId = activeUserId;
      await taskRepository.saveTask(task, activeUserId);
      // Reschedules can reuse logical occurrence IDs, so remove old OS alarms before reconciliation.
      await notificationService.cancelTaskReminders(task.id);
      let notificationsEnabled = true;
      if (task.status !== 'inbox') {
        try {
          notificationsEnabled = await notificationService.requestPermissions();
          setNotificationsAllowed(notificationsEnabled);
          if (notificationsEnabled) await notificationService.reconcileNotifications();
        } catch (notificationError) {
          console.warn('[Remindly] Reminder saved, but notification setup failed:', notificationError);
          notificationsEnabled = false;
          setNotificationsAllowed(false);
        }
      }
      const refreshed = await taskRepository.getAllTasks(activeUserId);
      setTasks(refreshed);
      return notificationsEnabled;
    } catch (e) {
      console.error('[Remindly] Failed to save captured task:', e);
      throw e;
    }
  }, [user]);

  // 3. Complete Task Callback: SQLite + Cancel Notification
  const handleTaskCompleted = useCallback(async (taskId: string) => {
    await taskRepository.completeTask(taskId);
    await notificationService.cancelTaskReminders(taskId);
    const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
    const refreshed = await taskRepository.getAllTasks(activeUserId);
    setTasks(refreshed);
  }, [user]);

  const handleTaskArchived = useCallback(async (taskId: string) => {
    await taskRepository.archiveTask(taskId);
    await notificationService.cancelTaskReminders(taskId);
    const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
    setTasks(await taskRepository.getAllTasks(activeUserId));
  }, [user]);

  const handleTaskDeleted = useCallback(async (taskId: string) => {
    await notificationService.cancelTaskReminders(taskId);
    await taskRepository.deleteTask(taskId);
    const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
    setTasks(await taskRepository.getAllTasks(activeUserId));
  }, [user]);

  // 3b. Restore Task (Undo) Callback
  const handleTaskRestored = useCallback(async (task: OmniTask) => {
    task.status = 'upcoming';
    const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
    task.userId = activeUserId;
    await taskRepository.saveTask(task, activeUserId);
    await notificationService.reconcileNotifications();
    const refreshed = await taskRepository.getAllTasks(activeUserId);
    setTasks(refreshed);
  }, [user]);

  // 3c. Request Notifications Permission Callback
  const handleRequestNotificationPermissions = useCallback(async () => {
    const granted = await notificationService.requestPermissions();
    setNotificationsAllowed(granted);
    if (granted) await notificationService.reconcileNotifications();
    return granted;
  }, []);

  // 4. Snooze Task Callback: SQLite + Reschedule Notification
  const handleTaskSnoozed = useCallback(async (taskId: string, minutes: number) => {
    try {
      await taskRepository.snoozeTask(taskId, minutes);
      await notificationService.cancelTaskReminders(taskId);
      await notificationService.reconcileNotifications();
      const activeUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
      const refreshed = await taskRepository.getAllTasks(activeUserId);
      setTasks(refreshed);
    } catch (e) {
      console.error('[Remindly] Failed to snooze task:', e);
      throw e;
    }
  }, [user]);

  // 5. Quiet Hours Settings
    // 5b. Notification Settings Handlers
  const handleNotificationsSoundChange = useCallback(async (enabled: boolean) => {
    await taskRepository.updateSetting('notifications_sound_enabled', enabled);
    setSettings((current) => ({ ...current, notificationsSoundEnabled: enabled }));
    try {
      await notificationService.reconcileNotifications();
    } catch (e) {
      console.warn('[Remindly] Could not reconcile after sound change:', e);
    }
  }, []);

  const handleNotificationsVibrationChange = useCallback(async (enabled: boolean) => {
    await taskRepository.updateSetting('notifications_vibration_enabled', enabled);
    setSettings((current) => ({ ...current, notificationsVibrationEnabled: enabled }));
  }, []);

  const handlePersistentFollowupsChange = useCallback(async (enabled: boolean) => {
    await taskRepository.updateSetting('persistent_followups_enabled', enabled);
    setSettings((current) => ({ ...current, persistentFollowupsEnabled: enabled }));
    try {
      await notificationService.reconcileNotifications();
    } catch (e) {
      console.warn('[Remindly] Could not reconcile after persistent follow-ups change:', e);
    }
  }, []);

  const handleLockScreenPrivacyChange = useCallback(async (enabled: boolean) => {
    await taskRepository.updateSetting('lock_screen_privacy', enabled);
    setSettings((current) => ({ ...current, lockScreenPrivacy: enabled }));
    try {
      await notificationService.reconcileNotifications();
    } catch (e) {
      console.warn('[Remindly] Could not reconcile after privacy change:', e);
    }
  }, []);

  const handleQuietHoursChange = useCallback(async (enabled: boolean) => {
    await taskRepository.updateSetting('quiet_hours_enabled', enabled);
    setSettings((current) => ({ ...current, quietHoursEnabled: enabled }));
    try {
      const taskIds = Array.from(new Set((await taskRepository.getPendingOccurrences()).map((item) => item.task_id)));
      await Promise.all(taskIds.map((taskId) => notificationService.cancelTaskReminders(taskId)));
      await notificationService.reconcileNotifications();
    } catch (error) {
      console.warn('[Remindly] Could not refresh notifications after quiet hours changed:', error);
    }
  }, []);

  const handleDefaultProfileChange = useCallback(async (profile: AppSettings['defaultProfile']) => {
    await taskRepository.updateSetting('default_profile_id', `builtin_${profile.toLowerCase()}`);
    setSettings((current) => ({ ...current, defaultProfile: profile }));
  }, []);

  const handleDateOnlyTimeChange = useCallback(async (time: string) => {
    await taskRepository.updateSetting('default_date_only_time', time);
    setSettings((current) => ({ ...current, dateOnlyTime: time }));
  }, []);

  // 6. Test Notification Trigger
  const handleTestNotification = useCallback(async () => {
    const notificationId = await notificationService.sendTestNotification();
    const allowed = await notificationService.hasPermission();
    setNotificationsAllowed(allowed);
    return Boolean(notificationId);
  }, []);

  // Sync Clerk Google User if authenticated
  useEffect(() => {
    if (clerkLoaded && clerkSignedIn && clerkUser) {
      const name = clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Google User';
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'G';

      const syncedUser: UserProfile = {
        isLoggedIn: true,
        name,
        email,
        avatarInitial: initials,
        authProvider: 'google',
      };

      taskRepository.saveUser(syncedUser).then(async () => {
        taskRepository.setCurrentUserId(syncedUser.email);
        setUser(syncedUser);
        setInitialView('app');
        const userTasks = await taskRepository.getAllTasks(syncedUser.email);
        setTasks(userTasks);
      });
    }
  }, [clerkLoaded, clerkSignedIn, clerkUser]);

  // 7. User Authentication Handlers (Google Sign In & Logout with Multi-User Isolation)
  const handleUserLogin = useCallback(async (newUser: UserProfile) => {
    await taskRepository.saveUser(newUser);
    const activeUserId = newUser.isLoggedIn ? (newUser.email || 'local_guest') : 'local_guest';
    taskRepository.setCurrentUserId(activeUserId);
    setUser(newUser);
    setInitialView('app');
    const userTasks = await taskRepository.getAllTasks(activeUserId);
    setTasks(userTasks);
  }, []);

  const handleUserLogout = useCallback(async () => {
    try {
      if (clerkSignedIn) {
        await clerk.signOut();
      }
    } catch (e) {
      console.warn('[Remindly] Clerk signout warning:', e);
    }
    await taskRepository.logoutUser();
    taskRepository.setCurrentUserId('local_guest');
    setUser(DEFAULT_USER);
    setInitialView('app');
    const guestTasks = await taskRepository.getAllTasks('local_guest');
    setTasks(guestTasks);
  }, [clerk, clerkSignedIn]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.lime} />
      </View>
    );
  }

  if (bootstrapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Local storage notice</Text>
        <Text style={styles.errorMessage}>{bootstrapError}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Pressable
            onPress={() => {
              setLoading(true);
              setBootstrapError(undefined);
              taskRepository.initFallback().then(() => {
                setRetryVersion((v) => v + 1);
              });
            }}
            style={[styles.retryButton, { backgroundColor: '#38BDF8' }]}
          >
            <Text style={[styles.retryButtonText, { color: '#0F172A' }]}>Continue in Safe Mode</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setLoading(true);
              setBootstrapError(undefined);
              setRetryVersion((version) => version + 1);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <RemindlyDesignReference
      initialTasks={tasks}
      initialSharedText={sharedText}
      initialSource={sharedSource}
      initialSourceUrl={sharedSourceUrl}
      initialSourceSubject={sharedSourceSubject}
      initialSourceSender={sharedSourceSender}
      initialSharedTitle={sharedTitle}
      initialShareRevision={shareRevision}
      notificationTaskId={notificationTaskId}
      notificationRevision={notificationRevision}
      initialView={initialView}
      currentUser={user}
      initialSettings={settings}
      notificationsAllowed={notificationsAllowed}
      onUserLogin={handleUserLogin}
      onUserLogout={handleUserLogout}
      onCaptureSaved={handleCaptureSaved}
      onTaskCompleted={handleTaskCompleted}
      onTaskArchived={handleTaskArchived}
      onTaskDeleted={handleTaskDeleted}
      onTaskSnoozed={handleTaskSnoozed}
      onTaskRestored={handleTaskRestored}
      onRequestNotificationPermissions={handleRequestNotificationPermissions}
      onQuietHoursChange={handleQuietHoursChange}
      onDefaultProfileChange={handleDefaultProfileChange}
      onDateOnlyTimeChange={handleDateOnlyTimeChange}
      notificationsSound={settings.notificationsSoundEnabled ?? true}
      onNotificationsSoundChange={handleNotificationsSoundChange}
      notificationsVibration={settings.notificationsVibrationEnabled ?? true}
      onNotificationsVibrationChange={handleNotificationsVibrationChange}
      persistentFollowups={settings.persistentFollowupsEnabled ?? true}
      onPersistentFollowupsChange={handlePersistentFollowupsChange}
      lockScreenPrivacy={settings.lockScreenPrivacy ?? false}
      onLockScreenPrivacyChange={handleLockScreenPrivacyChange}
      onTestNotification={handleTestNotification}
      onOpenNotificationSettings={() => Linking.openSettings()}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.lime} />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />
      <ThemeProvider>
        <MainApplication />
      </ThemeProvider>
    </SafeAreaProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: { color: C.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  errorMessage: { color: C.ink2, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  retryButton: { minWidth: 120, minHeight: 48, marginTop: 22, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.lime },
  retryButtonText: { color: C.black, fontSize: 15, fontWeight: '600' },
});
