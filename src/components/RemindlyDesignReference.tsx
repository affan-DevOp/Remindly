import { getTimeSortValue, isTaskOnSelectedDate, formatTimeLabel } from '../utils/taskScheduling';
import { captureDateSelection, captureDeadline, futureCaptureTime, CaptureDateMode } from '../utils/captureScheduling';
import { parseCaptureText } from '../domain/nlpParser';
/**
 * RemindlyDesignReference.tsx
 * Refined final visual and interaction reference for Remindly (Expo / React Native)
 *
 * Visual direction: diffuse amber/sage/lime radial light behind smoked glass, restrained translucency,
 * editorial page hierarchy, chartreuse focal accents, Plus Jakarta Sans, paper-note reminders, and a
 * floating glass navigation dock.
 *
 * Integrated with:
 * - Real local SQLite repository
 * - Native Android notification scheduler & quiet hours
 * - Share-intent receiver ingestion
 * - BlurTargetView / BlurView glass system with dimezisBlurViewSdk31Plus on Android
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text as RNText,
  TextInput,
  View,
  useWindowDimensions,
  type TextProps,
} from 'react-native';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurTargetView, BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProfile, DEFAULT_USER, AppSettings } from '../types/task';
import { quickCaptureOverlayService } from '../services/quickCaptureOverlayService';
import {
  ConfirmationConfig,
  SelectorConfig,
  SnackbarState,
  ConfirmationDialog,
  ContextualSelector,
  FeedbackSnackbar,
  PermissionExplainerSheet,
} from './popups';
import { useOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import Svg, { Defs, Ellipse, RadialGradient, Stop, Path } from 'react-native-svg';
import {
  AlarmClock,
  AlertTriangle,
  Trash2,
  Pencil,
  Undo2,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Inbox,
  Layers,
  Link2,
  Mail,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Vibrate,
  X,
} from 'lucide-react-native';

// Typography adapter: uses Plus Jakarta Sans once fonts have loaded, with a safe system fallback.
let jakartaFontsReady = false;
const JAKARTA_BY_WEIGHT: Record<string, string> = {
  '400': 'PlusJakartaSans_400Regular', normal: 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold', bold: 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold', '900': 'PlusJakartaSans_800ExtraBold',
};
function Text(props: TextProps) {
  const flat = StyleSheet.flatten(props.style);
  const weight = String(flat?.fontWeight ?? '400');
  const fontFamily = JAKARTA_BY_WEIGHT[weight] ?? 'PlusJakartaSans_400Regular';
  return <RNText {...props} style={[jakartaFontsReady ? { fontFamily } : undefined, props.style]} />;
}

// ----------------------------------------------------------------------------
// Design tokens - centralized styling values.
// ----------------------------------------------------------------------------

export const C = {
  canvas: '#100F0D',
  canvas2: '#17130F',
  surface: '#1C1915',
  surface2: '#24201B',
  surface3: '#2E2922',
  glass: 'rgba(42, 37, 30, 0.80)',
  glassLight: 'rgba(255, 255, 255, 0.055)',
  stroke: 'rgba(255,255,255,0.085)',
  strokeStrong: 'rgba(231,239,87,0.25)',
  lime: '#E0F34A',
  lime2: '#CFE53B',
  limeDark: '#9BAB23',
  ink: '#F7F5EE',
  ink2: '#D5D0C5',
  muted: '#948D80',
  muted2: '#6F695E',
  amber: '#C88D56',
  amberSoft: 'rgba(200,141,86,0.16)',
  green: '#78D4A0',
  red: '#FF8976',
  blue: '#8ABDF5',
  black: '#090908',
};

// ----------------------------------------------------------------------------
// Types and demo seed data.
// ----------------------------------------------------------------------------

export type TaskStatus = 'overdue' | 'upcoming' | 'inbox' | 'done';
export type TaskSource = 'WhatsApp' | 'Gmail' | 'Outlook' | 'Slack' | 'Telegram' | 'Notes' | 'Web' | 'Manual' | 'Other';
export type TabKey = 'today' | 'calendar' | 'inbox' | 'activity' | 'settings';
export type OverlayKey = 'quick' | 'reminder' | 'detail' | 'onboarding' | 'account' | 'permission_explainer' | 'sign_in' | null;

function GoogleIcon({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs />
      <Path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
      <Path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
      <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </Svg>
  );
}
export type ProfileKey = 'Simple' | 'Standard' | 'Important' | 'Persistent';

export type OmniTask = {
  id: string;
  title: string;
  timeLabel: string;
  dateLabel: string;
  status: TaskStatus;
  source: TaskSource;
  excerpt: string;
  sourceUrl?: string;
  sourceSubject?: string;
  sourceSender?: string;
  important?: boolean;
  profile: ProfileKey;
  createdAt: number;
  completedAt?: number;
  notes?: string;
  userId?: string;
  dueAtUtc?: string;
  dueLocalDate?: string;
  dueLocalTime?: string;
  dueTimezone?: string;
  duePrecision?: 'none' | 'date' | 'datetime';
};

export type Props = {
  /** Initial tasks from SQLite repository */
  initialTasks?: OmniTask[];
  /** If the native share receiver has a payload, pass it here and open the quick sheet. */
  initialSharedText?: string;
  initialSource?: TaskSource;
  initialSourceUrl?: string;
  initialSourceSubject?: string;
  initialSourceSender?: string;
  initialSharedTitle?: string;
  initialShareRevision?: number;
  notificationTaskId?: string;
  notificationRevision?: number;
  /** Useful for screenshot previews or a returning onboarding flow. */
  initialView?: 'app' | 'onboarding' | 'quick-capture';
  /** Current user profile */
  currentUser?: UserProfile;
  initialSettings?: any;
  notificationsAllowed?: boolean;
  /** Called when user completes Google or guest sign-in */
  onUserLogin?: (user: UserProfile) => void | Promise<void>;
  /** Called when user logs out */
  onUserLogout?: () => void | Promise<void>;
  onOnboardingDismissed?: () => void | Promise<void>;
  onQuickCaptureAnywhereChange?: (enabled: boolean) => void | Promise<void>;
  /** Wire this to the real local repository and notification scheduler. */
  onCaptureSaved?: (task: OmniTask) => void | Promise<any>;
  /** Wire this to the existing task completion service. */
  onTaskCompleted?: (taskId: string) => void | Promise<any>;
  onTaskArchived?: (taskId: string) => void | Promise<any>;
  onTaskDeleted?: (taskId: string) => void | Promise<any>;
  /** Wire this to the existing snooze service. */
  onTaskSnoozed?: (taskId: string, minutes: number) => void | Promise<any>;
  /** Quiet hours state changes */
  onQuietHoursChange?: (enabled: boolean) => void | Promise<any>;
  onDefaultProfileChange?: (profile: any) => void | Promise<any>;
  onDateOnlyTimeChange?: (time: string) => void | Promise<any>;
  /** Test notification trigger */
  onTestNotification?: () => void | Promise<any>;
  onTaskRestored?: (task: OmniTask) => void | Promise<any>;
  onRequestNotificationPermissions?: () => Promise<boolean>;
  notificationsSound?: boolean;
  onNotificationsSoundChange?: (enabled: boolean) => void | Promise<any>;
  notificationsVibration?: boolean;
  onNotificationsVibrationChange?: (enabled: boolean) => void | Promise<any>;
  persistentFollowups?: boolean;
  onPersistentFollowupsChange?: (enabled: boolean) => void | Promise<any>;
  lockScreenPrivacy?: boolean;
  onLockScreenPrivacyChange?: (enabled: boolean) => void | Promise<any>;
  onOpenNotificationSettings?: () => void | Promise<any>;
};

const seedTasks: OmniTask[] = [
  {
    id: 'task-101',
    title: 'Review revised consulting agreement',
    timeLabel: '9:00 AM',
    dateLabel: 'Today',
    status: 'overdue',
    source: 'Gmail',
    excerpt: 'Could you review the latest changes and send me your notes before our call?',
    sourceUrl: '',
    important: true,
    profile: 'Important',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'task-102',
    title: 'Follow up with design team on prototype specs',
    timeLabel: '11:00 AM',
    dateLabel: 'Today',
    status: 'upcoming',
    source: 'Slack',
    excerpt: 'Can you share the latest prototype specs with the team before lunch?',
    important: true,
    profile: 'Standard',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'task-103',
    title: 'Submit quarterly budget reconciliation report',
    timeLabel: '12:30 PM',
    dateLabel: 'Today',
    status: 'upcoming',
    source: 'Manual',
    excerpt: 'Quarterly finance deliverable.',
    profile: 'Standard',
    createdAt: Date.now() - 1000 * 60 * 38,
  },
  {
    id: 'task-104',
    title: 'Send portfolio to recruiter',
    timeLabel: '2:00 PM',
    dateLabel: 'Today',
    status: 'upcoming',
    source: 'WhatsApp',
    excerpt: 'Hey, send me your portfolio when you get a chance today.',
    profile: 'Simple',
    createdAt: Date.now() - 1000 * 60 * 20,
  },
  {
    id: 'task-105',
    title: 'Book train tickets for Patna trip',
    timeLabel: '9:00 AM',
    dateLabel: 'Tomorrow',
    status: 'upcoming',
    source: 'Notes',
    excerpt: 'Confirm dates and book tickets before prices increase.',
    profile: 'Standard',
    createdAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: 'task-106',
    title: 'Reply to Maya about venue lease',
    timeLabel: 'No deadline',
    dateLabel: 'Inbox',
    status: 'inbox',
    source: 'WhatsApp',
    excerpt: 'Hey, let me know if you had a chance to speak with the landlord. We have another interested party asking.',
    profile: 'Standard',
    createdAt: Date.now() - 1000 * 60 * 5,
  },
];

export const PROFILE_DESCRIPTIONS: Record<ProfileKey, string> = {
  Simple: 'At the deadline',
  Standard: '1 day before · 1 hour before · Due',
  Important: '1 day · 4 hours · 15 minutes · Due',
  Persistent: 'Standard reminders + limited follow-ups',
};

// ----------------------------------------------------------------------------
// Root component.
// ----------------------------------------------------------------------------

export default function RemindlyDesignReference(props: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? ((StatusBar.currentHeight || 44) + 14) : 20,
    52
  );
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 46 : 16,
    42
  );

  const [user, setUser] = useState<UserProfile>(props.currentUser || DEFAULT_USER);
  const switchingAccount = useRef(false);

  useEffect(() => {
    if (props.currentUser) {
      setUser(props.currentUser);
    }
  }, [props.currentUser]);

  const handleUserLogin = async (newUser: UserProfile) => {
    await props.onUserLogin?.(newUser);
    setUser(newUser);
  };

  const handleUserLogout = async () => {
    try {
      await props.onUserLogout?.();
      setUser({ ...DEFAULT_USER });
      setOverlay(null);
    } catch {
      showSnackbar('Could not sign out. Please try again.', { icon: 'info' });
    }
  };

  const handleAccountSwitch = async () => {
    if (switchingAccount.current) return;
    switchingAccount.current = true;
    try {
      if (user.isLoggedIn) {
        await props.onUserLogout?.();
        setUser({ ...DEFAULT_USER });
      }
      setOverlay('sign_in');
    } catch {
      showSnackbar('Could not switch accounts. Please try again.', { icon: 'info' });
    } finally { switchingAccount.current = false; }
  };

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });
  jakartaFontsReady = fontsLoaded;
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const blurTargetRef = useRef<any>(null);
  const [tab, setTab] = useState<TabKey>('today');
  const [tasks, setTasks] = useState<OmniTask[]>(
    props.initialTasks ?? seedTasks
  );
  const [overlay, setOverlay] = useState<OverlayKey>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('task-101');
  const [filter, setFilter] = useState<'all' | 'important' | 'notes'>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quietHours, setQuietHours] = useState(true);
  const [defaultProfile, setDefaultProfile] = useState<ProfileKey>('Standard');
  const [dateOnlyTime, setDateOnlyTime] = useState('09:00 AM');
  const [notificationsSound, setNotificationsSound] = useState(props.initialSettings?.notificationsSoundEnabled ?? true);
  const [notificationsVibration, setNotificationsVibration] = useState(props.initialSettings?.notificationsVibrationEnabled ?? true);
  const [persistentFollowups, setPersistentFollowups] = useState(props.initialSettings?.persistentFollowupsEnabled ?? true);
  const [lockScreenPrivacy, setLockScreenPrivacy] = useState(props.initialSettings?.lockScreenPrivacy ?? false);
  const [testSent, setTestSent] = useState(false);
  const [toast, setToast] = useState('');
  const [sharedCapture, setSharedCapture] = useState(false);
  const [captureRevision, setCaptureRevision] = useState(0);
  const [editingCaptureTask, setEditingCaptureTask] = useState<OmniTask | undefined>();
  const [overlayPermissionGranted, setOverlayPermissionGranted] = useState(false);
  const [quickCaptureAnywhere, setQuickCaptureAnywhere] = useState(false);
  const mutationInFlight = useRef(false);

  // Android Popup & Overlay Design System State
  const [confirmationConfig, setConfirmationConfig] = useState<ConfirmationConfig | null>(null);
  const [selectorConfig, setSelectorConfig] = useState<SelectorConfig | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const quickCaptureIsDirtyRef = useRef(false);

  const showSnackbar = useCallback(
    (
      message: string,
      options?: {
        icon?: 'check' | 'clock' | 'trash' | 'info';
        actionLabel?: string;
        onAction?: () => void;
        duration?: number;
      }
    ) => {
      setSnackbar({
        id: `snack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message,
        icon: options?.icon || 'check',
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
        duration: options?.duration,
      });
    },
    []
  );

  useEffect(() => {
    if (props.initialSettings) {
      if (typeof props.initialSettings.quietHoursEnabled === 'boolean') setQuietHours(props.initialSettings.quietHoursEnabled);
      if (props.initialSettings.defaultProfile) setDefaultProfile(props.initialSettings.defaultProfile);
      if (props.initialSettings.dateOnlyTime) setDateOnlyTime(props.initialSettings.dateOnlyTime);
      if (typeof props.initialSettings.notificationsSoundEnabled === 'boolean') setNotificationsSound(props.initialSettings.notificationsSoundEnabled);
      if (typeof props.initialSettings.notificationsVibrationEnabled === 'boolean') setNotificationsVibration(props.initialSettings.notificationsVibrationEnabled);
      if (typeof props.initialSettings.persistentFollowupsEnabled === 'boolean') setPersistentFollowups(props.initialSettings.persistentFollowupsEnabled);
      if (typeof props.initialSettings.lockScreenPrivacy === 'boolean') setLockScreenPrivacy(props.initialSettings.lockScreenPrivacy);
    }
  }, [props.initialSettings]);

  useEffect(() => {
    if (props.initialTasks !== undefined) {
      setTasks(props.initialTasks);
    }
  }, [props.initialTasks]);

  useEffect(() => {
    if (props.initialView === 'onboarding') setOverlay('onboarding');
    else if (props.initialView === 'quick-capture') setOverlay('quick');
  }, [props.initialView]);

  useEffect(() => {
    if (props.initialSharedText) {
      setEditingCaptureTask(undefined);
      setSharedCapture(true);
      setCaptureRevision((revision) => revision + 1);
      setOverlay('quick');
    }
  }, [props.initialSharedText, props.initialShareRevision]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [tasks, selectedTaskId],
  );

  const visibleTasks = useMemo(() => {
    let result = tasks;
    if (tab === 'inbox') result = result.filter((task) => task.status === 'inbox');
    else if (tab === 'today') result = result.filter((task) => task.status !== 'inbox' && task.status !== 'done');
    else if (tab === 'activity') result = result.filter((task) => task.status === 'done' || task.status === 'overdue');
    if (tab === 'today' && filter === 'important') result = result.filter((task) => task.important || task.profile === 'Important' || task.profile === 'Persistent');
    if (tab === 'today' && filter === 'notes') result = result.filter((task) => task.source === 'Notes' || task.source === 'Manual');
    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      result = result.filter((task) => `${task.title} ${task.excerpt} ${task.source}`.toLowerCase().includes(needle));
    }
    return result;
  }, [tasks, tab, filter, searchTerm]);

  const notify = useCallback(
    (message: string) => {
      showSnackbar(message);
    },
    [showSnackbar]
  );

  useEffect(() => {
    const refreshOverlay = async () => {
      setOverlayPermissionGranted(await quickCaptureOverlayService.canDrawOverlays());
      setQuickCaptureAnywhere(await quickCaptureOverlayService.isOverlayServiceRunning());
    };
    void refreshOverlay();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshOverlay();
    });
    return () => subscription.remove();
  }, []);

  const toggleOverlay = async (enabled: boolean) => {
    if (!quickCaptureOverlayService.isSupported()) {
      notify('Floating capture requires an Android development build.');
      return;
    }
    if (enabled && !(await quickCaptureOverlayService.canDrawOverlays())) {
      notify('Grant display over other apps access, then enable floating capture.');
      await quickCaptureOverlayService.openOverlaySettings();
      return;
    }
    const ok = enabled ? await quickCaptureOverlayService.startOverlayService() : await quickCaptureOverlayService.stopOverlayService();
    if (!ok) { notify('Could not change floating capture. Please try again.'); return; }
    setQuickCaptureAnywhere(enabled);
    try { await props.onQuickCaptureAnywhereChange?.(enabled); }
    catch { notify('Floating capture changed, but the preference could not be saved.'); }
  };

  // Await persistence before showing success or exposing Undo; serialize double taps.
  const runMutation = async (action: () => Promise<void>) => {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    try { await action(); }
    catch { showSnackbar('Could not save changes. Please try again.', { icon: 'info' }); }
    finally { mutationInFlight.current = false; }
  };

  const handleCloseQuickCapture = useCallback(() => {
    if (quickCaptureIsDirtyRef.current) {
      setConfirmationConfig({
        title: 'Discard unsaved reminder?',
        message: 'You have an unsaved reminder note. If you discard now, your note will not be saved.',
        confirmLabel: 'Discard reminder',
        cancelLabel: 'Keep editing',
        isDestructive: true,
        onConfirm: () => {
          quickCaptureIsDirtyRef.current = false;
          setOverlay(null);
        },
      });
    } else {
      setOverlay(null);
    }
  }, []);

  const handleOpenProfileSelector = useCallback(
    (currentProfile: ProfileKey, onSelectProfile: (p: ProfileKey) => void) => {
      const profileOptions: { label: string; detail: string; value: ProfileKey; accentColor: string }[] = [
        { label: 'Simple', detail: 'One alert at the deadline', value: 'Simple', accentColor: '#9DBBA5' },
        { label: 'Standard', detail: '24h before · 1h before · deadline', value: 'Standard', accentColor: '#B8B3A6' },
        { label: 'Important', detail: '24h · 4h · 15m · deadline (2-pulse vibration)', value: 'Important', accentColor: '#E0F34A' },
        { label: 'Persistent', detail: 'Standard + 2 follow-ups (+15m, +60m)', value: 'Persistent', accentColor: '#D9B57D' },
      ];
      setSelectorConfig({
        title: 'Reminder Profile',
        subtitle: 'Choose how Remindly nudges you for this reminder.',
        options: profileOptions.map((opt) => ({
          ...opt,
          selected: opt.value === currentProfile,
        })),
        onSelect: (val) => {
          onSelectProfile(val as ProfileKey);
          setSelectorConfig(null);
        },
        onClose: () => setSelectorConfig(null),
      });
    },
    []
  );

  const completeTask = (task: OmniTask) => runMutation(async () => {
    await props.onTaskCompleted?.(task.id);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: 'done', completedAt: Date.now() } : item));
    setOverlay(null);
    showSnackbar('Reminder completed', {
      actionLabel: 'Undo',
      onAction: () => { void runMutation(async () => {
        if (props.onTaskRestored) await props.onTaskRestored(task);
        else await props.onCaptureSaved?.(task);
        setTasks((current) => current.map((item) => item.id === task.id ? task : item));
        showSnackbar('Reminder restored');
      }); },
    });
  });

  const snoozeTask = (task: OmniTask, minutes: number) => runMutation(async () => {
    await props.onTaskSnoozed?.(task.id, minutes);
    setOverlay(null);
    showSnackbar('Reminder snoozed for ' + minutes + ' min', {
      icon: 'clock', actionLabel: 'Undo',
      onAction: () => { void runMutation(async () => {
        await props.onCaptureSaved?.(task);
        setTasks((current) => current.map((item) => item.id === task.id ? task : item));
        showSnackbar('Snooze cancelled', { icon: 'info' });
      }); },
    });
  });

  const deleteTask = (task: OmniTask) => {
    setConfirmationConfig({
      title: 'Delete reminder?',
      message: 'Delete "' + task.title + '"? All scheduled alert milestones will be cancelled.',
      confirmLabel: 'Delete reminder', cancelLabel: 'Keep reminder', isDestructive: true,
      onConfirm: () => { void runMutation(async () => {
        await props.onTaskDeleted?.(task.id);
        setTasks((current) => current.filter((item) => item.id !== task.id));
        setOverlay(null);
        showSnackbar('Reminder deleted', {
          icon: 'trash', actionLabel: 'Undo',
          onAction: () => { void runMutation(async () => {
            await props.onCaptureSaved?.(task);
            setTasks((current) => current.some((item) => item.id === task.id) ? current : [task, ...current]);
            showSnackbar('Reminder restored');
          }); },
        });
      }); },
    });
  };

  const saveEditedTask = (updatedTask: OmniTask) => runMutation(async () => {
    await props.onCaptureSaved?.(updatedTask);
    setTasks((current) => current.map((item) => item.id === updatedTask.id ? updatedTask : item));
    setIsEditingDetail(false);
    showSnackbar('Changes saved');
  });

  // Android Hardware Back Button Unified Handler
  useEffect(() => {
    const onHardwareBack = () => {
      // Priority 1: Dismiss confirmation dialog
      if (confirmationConfig) {
        confirmationConfig.onCancel?.();
        setConfirmationConfig(null);
        return true;
      }
      // Priority 2: Dismiss contextual selector
      if (selectorConfig) {
        selectorConfig.onClose?.();
        setSelectorConfig(null);
        return true;
      }
      // Priority 3: Revert task edit mode to review mode
      if (isEditingDetail) {
        setIsEditingDetail(false);
        return true;
      }
      // Priority 4: Quick Capture discard confirmation or close
      if (overlay === 'quick') {
        if (quickCaptureIsDirtyRef.current) {
          handleCloseQuickCapture();
          return true;
        }
        setOverlay(null);
        return true;
      }
      // Priority 5: Close any other active overlay
      if (overlay && overlay !== 'onboarding') {
        setOverlay(null);
        return true;
      }
      // Priority 6: Close search if open
      if (searchOpen) {
        setSearchOpen(false);
        setSearchTerm('');
        return true;
      }
      // Priority 7: Return to Today tab
      if (tab !== 'today') {
        setTab('today');
        return true;
      }
      // Priority 8: System default
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [confirmationConfig, selectorConfig, isEditingDetail, overlay, searchOpen, tab, handleCloseQuickCapture]);

  useEffect(() => {
    if (props.notificationTaskId) {
      setSelectedTaskId(props.notificationTaskId);
      setOverlay('detail');
    }
  }, [props.notificationTaskId, props.notificationRevision]);

  const [captureDateMode, setCaptureDateMode] = useState<'today' | 'tomorrow' | 'custom' | 'inbox'>('today');
  const [captureDaysOffset, setCaptureDaysOffset] = useState<number>(2);

  const startQuickCapture = useCallback((mode: 'today' | 'tomorrow' | 'custom' | 'inbox' = 'today', offset: number = 2) => {
    setEditingCaptureTask(undefined);
    setSharedCapture(false);
    setCaptureRevision((revision) => revision + 1);
    quickCaptureIsDirtyRef.current = false;
    setCaptureDateMode(mode);
    setCaptureDaysOffset(offset);
    setOverlay('quick');
  }, []);

  const saveCapture = useCallback(async (task: OmniTask) => {
    const notificationsEnabled = await props.onCaptureSaved?.(task);
    setTasks((current) => [task, ...current.filter((item) => item.id !== task.id)]);
    quickCaptureIsDirtyRef.current = false;
    setSelectedTaskId(task.id);
    setOverlay(null);
    setTab(task.status === 'inbox' ? 'inbox' : 'today');
    notify(task.status === 'inbox' ? 'Saved to Inbox' : notificationsEnabled === false ? 'Reminder saved. Notifications are disabled.' : 'Reminder saved');
  }, [notify, props]);

  const openTask = (task: OmniTask) => {
    setIsEditingDetail(false);
    setSelectedTaskId(task.id);
    setOverlay('detail');
  };

  const updatePreference = async <T,>(value: T, previous: T, setter: (value: T) => void, persist?: (value: T) => void | Promise<any>) => {
    setter(value);
    try { await persist?.(value); }
    catch { setter(previous); notify('Could not save this setting. Please try again.'); }
  };

  const renderContent = () => {
    if (tab === 'settings') {
      return (
        <SettingsScreen
          quickCaptureAnywhere={quickCaptureAnywhere}
          overlayPermissionGranted={overlayPermissionGranted}
          onQuickCaptureAnywhereToggle={(enabled) => { void toggleOverlay(enabled); }}
          onStopOverlayService={() => { void toggleOverlay(false); }}
          onGrantOverlayPermission={async () => {
            if (!(await quickCaptureOverlayService.openOverlaySettings())) notify('Overlay settings require an Android development build.');
          }}
          quietHours={quietHours}
          onQuietHours={(value) => { void updatePreference(value, quietHours, setQuietHours, props.onQuietHoursChange); }}
          defaultProfile={defaultProfile}
          onDefaultProfileChange={(value) => { void updatePreference(value, defaultProfile, setDefaultProfile, props.onDefaultProfileChange); }}
          dateOnlyTime={formatTimeLabel(dateOnlyTime)}
          onDateOnlyTimeChange={(value) => { void updatePreference(value, dateOnlyTime, setDateOnlyTime, props.onDateOnlyTimeChange); }}
          notificationsSound={notificationsSound}
          onNotificationsSoundChange={(value) => { void updatePreference(value, notificationsSound, setNotificationsSound, props.onNotificationsSoundChange); }}
          notificationsVibration={notificationsVibration}
          onNotificationsVibrationChange={(value) => { void updatePreference(value, notificationsVibration, setNotificationsVibration, props.onNotificationsVibrationChange); }}
          persistentFollowups={persistentFollowups}
          onPersistentFollowupsChange={(value) => { void updatePreference(value, persistentFollowups, setPersistentFollowups, props.onPersistentFollowupsChange); }}
          lockScreenPrivacy={lockScreenPrivacy}
          onLockScreenPrivacyChange={(value) => { void updatePreference(value, lockScreenPrivacy, setLockScreenPrivacy, props.onLockScreenPrivacyChange); }}
          notificationsAllowed={props.notificationsAllowed}
          onOpenNotificationSettings={async () => {
            try { await props.onOpenNotificationSettings?.(); }
            catch { notify('Open your device settings to manage notifications.'); }
          }}
          testSent={testSent}
          onTest={async () => {
            setTestSent(true);
            try {
              const res = await props.onTestNotification?.();
              if (res === false) {
                notify('Could not schedule test. Permissions may be missing.');
              } else {
                notify('Test reminder scheduled for 2 seconds from now');
              }
            } catch (e) {
              notify('Test reminder failed to schedule.');
            } finally {
              setTimeout(() => setTestSent(false), 4000);
            }
          }}
          onOnboarding={() => setOverlay('onboarding')}
        />
      );
    }
    if (tab === 'calendar') {
      return <CalendarScreen tasks={visibleTasks} onOpenTask={openTask} onAdd={startQuickCapture} />;
    }
    if (tab === 'activity') {
      return <ActivityScreen tasks={visibleTasks} onOpenTask={openTask} />;
    }
    if (tab === 'inbox') {
      return <InboxScreen tasks={visibleTasks} onOpenTask={openTask} onAdd={() => startQuickCapture('inbox')} />;
    }
    return (
      <TodayScreen
        tasks={visibleTasks}
        user={user}
        onOpenAccount={() => setOverlay('account')}
        filter={filter}
        setFilter={setFilter}
        onOpenTask={openTask}
        onCompleteTask={completeTask}
        onAdd={startQuickCapture}
        blurTarget={blurTargetRef}
        bottomInset={bottomInset}
        compact={compact}
        onNotify={notify}
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <BlurTargetView ref={blurTargetRef} style={styles.targetRoot}>
        <LinearGradient colors={[C.canvas, '#15110D', C.canvas]} style={styles.rootGradient}>
          <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.ambientSvg}>
            <Defs>
              <RadialGradient id="omniAmberGlow" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor="#B88945" stopOpacity="0.33" /><Stop offset="56%" stopColor="#936B36" stopOpacity="0.13" /><Stop offset="100%" stopColor="#936B36" stopOpacity="0" /></RadialGradient>
              <RadialGradient id="omniSageGlow" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor="#829C70" stopOpacity="0.22" /><Stop offset="62%" stopColor="#718B61" stopOpacity="0.08" /><Stop offset="100%" stopColor="#718B61" stopOpacity="0" /></RadialGradient>
              <RadialGradient id="omniLimeGlow" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor="#DCEC59" stopOpacity="0.14" /><Stop offset="55%" stopColor="#B6C844" stopOpacity="0.045" /><Stop offset="100%" stopColor="#B6C844" stopOpacity="0" /></RadialGradient>
              <RadialGradient id="omniUmberGlow" cx="50%" cy="50%" r="50%"><Stop offset="0%" stopColor="#755334" stopOpacity="0.25" /><Stop offset="64%" stopColor="#5D432C" stopOpacity="0.07" /><Stop offset="100%" stopColor="#5D432C" stopOpacity="0" /></RadialGradient>
            </Defs>
            <Ellipse cx="91" cy="7" rx="58" ry="45" fill="url(#omniAmberGlow)" />
            <Ellipse cx="-3" cy="47" rx="48" ry="35" fill="url(#omniSageGlow)" />
            <Ellipse cx="79" cy="62" rx="35" ry="32" fill="url(#omniLimeGlow)" />
            <Ellipse cx="51" cy="104" rx="65" ry="42" fill="url(#omniUmberGlow)" />
          </Svg>
          <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.032)', 'rgba(255,255,255,0.008)', 'transparent']} locations={[0, 0.30, 1]} style={styles.backdropVeil} />
          <View style={[styles.appFrame, width > 760 && styles.appFrameWide]}>
            <Header
              blurTarget={blurTargetRef}
              topInset={topInset}
              user={user}
              searchOpen={searchOpen}
              searchTerm={searchTerm}
              hasInboxMessages={tasks.some((t) => t.status === 'inbox')}
              onSearchTerm={setSearchTerm}
              onToggleSearch={() => { if (searchOpen) setSearchTerm(''); setSearchOpen((value) => !value); }}
              onOpenAccount={() => setOverlay('account')}
              onBell={() => {
                const scheduled = tasks.filter((item) => item.status !== 'done' && item.status !== 'inbox')
                  .sort((a, b) => Date.parse(a.dueAtUtc || '') - Date.parse(b.dueAtUtc || ''));
                const task = scheduled[0];
                if (task) {
                  setSelectedTaskId(task.id);
                  setOverlay('reminder');
                } else if (tasks.some((item) => item.status === 'inbox')) setTab('inbox');
                else notify('You are all caught up');
              }}
            />
            <View style={styles.topDivider} />
            <View style={styles.contentViewport}>
              <ScrollView
                key={tab}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {renderContent()}
              </ScrollView>
            </View>
            <BottomNav tab={tab} onTab={setTab} onAdd={() => startQuickCapture()} blurTarget={blurTargetRef} bottomInset={bottomInset} />
          </View>
        </LinearGradient>
      </BlurTargetView>

            {overlay && overlay !== 'onboarding' ? (
        <View style={styles.overlayRoot}>
          <BlurView
            blurTarget={blurTargetRef}
            intensity={Platform.OS === 'web' ? 45 : 55}
            tint="dark"
            blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={styles.overlayDimmer}
            onPress={() => {
              if (overlay === 'quick') handleCloseQuickCapture();
              else setOverlay(null);
            }}
            accessibilityLabel="Dismiss dialog"
          />
          {overlay === 'quick' && (
            <QuickCaptureSheet
              key={captureRevision}
              editingTask={editingCaptureTask}
              initialText={sharedCapture ? props.initialSharedText ?? '' : ''}
              initialSource={sharedCapture ? props.initialSource ?? 'Manual' : 'Manual'}
              defaultProfile={defaultProfile}
              dateOnlyTime={dateOnlyTime}
              initialSourceUrl={sharedCapture ? props.initialSourceUrl : undefined}
              initialSubject={sharedCapture ? props.initialSourceSubject : undefined}
              initialSender={sharedCapture ? props.initialSourceSender : undefined}
              initialTitle={sharedCapture ? props.initialSharedTitle : undefined}
              initialDateMode={captureDateMode}
              initialDaysOffset={captureDaysOffset}
              blurTarget={blurTargetRef}
              bottomInset={bottomInset}
              onClose={handleCloseQuickCapture}
              onSave={saveCapture}
              onError={notify}
              onDirtyChange={(dirty) => {
                quickCaptureIsDirtyRef.current = dirty;
              }}
              onOpenProfileSelector={handleOpenProfileSelector}
            />
          )}
          {overlay === 'account' && (
            <AccountProfileSheet
              user={user}
              blurTarget={blurTargetRef}
              bottomInset={bottomInset}
              onClose={() => setOverlay(null)}
              onLogout={handleUserLogout}
              onConnectGoogle={handleAccountSwitch}
            />
          )}
          {overlay === 'sign_in' && (
            <SignInSheet
              blurTarget={blurTargetRef}
              bottomInset={bottomInset}
              onClose={() => setOverlay(null)}
              onSignIn={async (u) => {
                await handleUserLogin(u);
                notify(u.isLoggedIn ? `Welcome, ${u.name}!` : 'Continuing as guest');
              }}
            />
          )}
          {overlay === 'reminder' && selectedTask && (
            <ReminderAlertCard
              task={selectedTask}
              onClose={() => setOverlay(null)}
              onDone={() => completeTask(selectedTask)}
              onSnooze={() => snoozeTask(selectedTask, 15)}
              onDetails={() => setOverlay('detail')}
            />
          )}
          {overlay === 'detail' && selectedTask && (
            <TaskDetailsSheet
              task={selectedTask}
              bottomInset={bottomInset}
              blurTarget={blurTargetRef}
              isEditing={isEditingDetail}
              onToggleEdit={setIsEditingDetail}
              onClose={() => {
                setIsEditingDetail(false);
                setOverlay(null);
              }}
              onDone={() => completeTask(selectedTask)}
              onSnooze={(minutes) => snoozeTask(selectedTask, minutes)}
              onDelete={() => deleteTask(selectedTask)}
              onSaveEdit={saveEditedTask}
              onReschedule={() => {
                setEditingCaptureTask(selectedTask);
                setSharedCapture(false);
                const target = selectedTask.dueAtUtc ? new Date(selectedTask.dueAtUtc) : new Date();
                const selection = captureDateSelection(target);
                setCaptureDateMode(selection.offset <= 0 ? 'today' : selection.mode);
                setCaptureDaysOffset(Math.max(0, selection.offset));
                setCaptureRevision((revision) => revision + 1);
                setOverlay('quick');
              }}
              onOpenSource={() => {
                if (selectedTask.sourceUrl) {
                  Linking.openURL(selectedTask.sourceUrl).catch(() => {
                    notify('Could not open external link');
                  });
                } else {
                  notify('Source excerpt is preserved on device');
                }
              }}
              onOpenProfileSelector={handleOpenProfileSelector}
            />
          )}
          {overlay === 'permission_explainer' && (
            <PermissionExplainerSheet
              blurTarget={blurTargetRef}
              bottomInset={bottomInset}
              onEnable={async () => {
                setOverlay(null);
                if (props.onRequestNotificationPermissions) {
                  const ok = await props.onRequestNotificationPermissions();
                  showSnackbar(ok ? 'Notifications enabled' : 'Notifications disabled in system settings', {
                    icon: ok ? 'check' : 'info',
                  });
                }
              }}
              onClose={() => setOverlay(null)}
            />
          )}
        </View>
      ) : null}

      {/* Small Selection Popup */}
      {selectorConfig ? (
        <ContextualSelector
          config={selectorConfig}
          blurTarget={blurTargetRef}
          bottomInset={bottomInset}
        />
      ) : null}

      {/* Confirmation Dialog */}
      {confirmationConfig ? (
        <ConfirmationDialog
          config={confirmationConfig}
          onClose={() => setConfirmationConfig(null)}
        />
      ) : null}

      {/* Floating Success Feedback (Snackbar with Undo) */}
      <FeedbackSnackbar
        snackbar={snackbar}
        onDismiss={() => setSnackbar(null)}
        bottomInset={bottomInset}
      />

      {overlay === 'onboarding' && (
        <View style={styles.fullscreenOverlay}>
          <OnboardingScreen
            topInset={topInset}
            bottomInset={bottomInset}
            onClose={() => { void props.onOnboardingDismissed?.(); setOverlay(null); }}
            onStart={() => { void props.onOnboardingDismissed?.(); setOverlay(null); }}
            onGoogleSignIn={handleUserLogin}
            onOpenSignIn={() => setOverlay('sign_in')}
          />
        </View>
      )}

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <CheckCircle2 color={C.lime} size={17} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ----------------------------------------------------------------------------
// Header and main app screens.
// ----------------------------------------------------------------------------



function MonthYearPickerSheet({
  currentYear,
  currentMonth,
  onSelectMonthYear,
  onClose,
  bottomInset,
}: {
  currentYear: number;
  currentMonth: number;
  onSelectMonthYear: (year: number, month: number) => void;
  onClose: () => void;
  bottomInset: number;
}) {
  const [year, setYear] = useState(currentYear);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={[styles.rDetailsSheet, {
      backgroundColor: '#1E1914',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: 'rgba(255, 244, 218, 0.22)',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'web' ? 24 : Math.max(bottomInset, 20) + 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.64,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: -12 },
      elevation: 25,
    }]}>
      {Platform.OS !== 'android' ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <LinearGradient pointerEvents="none" colors={['rgba(53,44,31,0.96)', 'rgba(29,25,20,0.98)', 'rgba(22,19,15,1.0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetEyebrow}>TIMELINE CALENDAR</Text>
          <Text style={styles.detailsTitle}>Select Month & Year</Text>
        </View>
        <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close month picker">
          <X size={18} color={C.ink2} />
        </Pressable>
      </View>

      {/* Year Selector */}
      <View style={styles.yearSelectRow}>
        <Pressable onPress={() => setYear((y) => y - 1)} style={styles.yearNavBtn} accessibilityLabel="Previous Year">
          <ChevronLeft size={20} color={C.ink} />
        </Pressable>
        <Text style={styles.yearSelectTitle}>{year}</Text>
        <Pressable onPress={() => setYear((y) => y + 1)} style={styles.yearNavBtn} accessibilityLabel="Next Year">
          <ChevronRight size={20} color={C.ink} />
        </Pressable>
      </View>

      {/* 12 Months Grid */}
      <View style={styles.monthGrid}>
        {monthNames.map((name, idx) => {
          const isSelected = year === currentYear && idx === currentMonth;
          const isCurrentRealMonth = year === new Date().getFullYear() && idx === new Date().getMonth();
          return (
            <Pressable
              key={name}
              onPress={() => {
                onSelectMonthYear(year, idx);
                onClose();
              }}
              style={[styles.monthTile, isSelected && styles.monthTileSelected]}
            >
              <Text style={[styles.monthTileText, isSelected && styles.monthTileTextSelected]}>{name}</Text>
              {isCurrentRealMonth && !isSelected ? <View style={styles.currentMonthDot} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          const now = new Date();
          onSelectMonthYear(now.getFullYear(), now.getMonth());
          onClose();
        }}
        style={styles.jumpTodayBtn}
      >
        <Sparkles size={15} color={C.black} />
        <Text style={styles.jumpTodayText}>Jump to Current Month</Text>
      </Pressable>
    </View>
  );
}

function Header(props: {
  blurTarget: React.RefObject<any>;
  topInset: number;
  user?: UserProfile;
  searchOpen: boolean;
  searchTerm: string;
  hasInboxMessages?: boolean;
  onSearchTerm: (value: string) => void;
  onToggleSearch: () => void;
  onBell: () => void;
  onOpenAccount: () => void;
}) {
  return (
    <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : props.topInset + 8, minHeight: 67 + (Platform.OS === 'web' ? 0 : props.topInset) }]}>
      <BlurView blurTarget={props.blurTarget} intensity={Platform.OS === 'web' ? 26 : 30} tint="dark" blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'} style={StyleSheet.absoluteFill} />
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><View style={styles.brandMarkCore} /></View>
        <Text style={styles.brandName}>Remind<Text style={styles.brandNameLight}>ly</Text></Text>
      </View>
      {props.searchOpen ? (
        <View style={styles.headerSearch}>
          <Search size={16} color={C.muted} />
          <TextInput
            value={props.searchTerm}
            onChangeText={props.onSearchTerm}
            placeholder="Search reminders"
            placeholderTextColor={C.muted2}
            style={styles.headerSearchInput}
            autoFocus
          />
          <Pressable onPress={props.onToggleSearch} hitSlop={10}><X size={16} color={C.ink2} /></Pressable>
        </View>
      ) : (
        <View style={styles.headerActions}>
          <Pressable onPress={props.onToggleSearch} style={styles.iconButton} accessibilityLabel="Search reminders"><Search size={18} color={C.ink2} /></Pressable>
          <Pressable onPress={props.onBell} style={styles.iconButton} accessibilityLabel="Show next reminder">
            <Bell size={18} color={C.lime} />
            {props.hasInboxMessages ? <View style={styles.notificationDot} /> : null}
          </Pressable>
          <Pressable onPress={props.onOpenAccount} style={[styles.avatar, { width: 36, height: 36 }]} accessibilityLabel="Account & Profile">
            <Text style={[styles.avatarLetter, { fontSize: 13 }]}>{props.user?.avatarInitial || 'A'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function TodayScreen(props: {
  tasks: OmniTask[];
  user?: UserProfile;
  onOpenAccount: () => void;
  filter: 'all' | 'important' | 'notes';
  setFilter: (value: 'all' | 'important' | 'notes') => void;
  onOpenTask: (task: OmniTask) => void;
  onCompleteTask: (task: OmniTask) => void;
  onAdd: (mode?: 'today' | 'tomorrow' | 'custom' | 'inbox', offset?: number) => void;
  blurTarget: React.RefObject<any>;
  bottomInset: number;
  compact: boolean;
  onNotify?: (msg: string) => void;
}) {
  const overdue = props.tasks.filter((task) => task.status === 'overdue').length;
  const remaining = props.tasks.filter((task) => task.status !== 'done').length;
  const firstName = props.user?.name ? props.user.name.trim().split(' ')[0] : 'there';

  // Dynamic Timeline Calendar State (Functional Month & Year)
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showAllMonthDays, setShowAllMonthDays] = useState(false);

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // Generate days for currently viewed month & year
  // By default: Show current date (today) and next from it!
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    if (isCurrentMonth && !showAllMonthDays) {
      // Strictly show current month days from today to end of month (no dates from next month)
      const todayDate = now.getDate();
      const count = Math.max(1, totalDays - todayDate + 1);
      return Array.from({ length: count }, (_, i) => {
        const dayNum = todayDate + i;
        const d = new Date(viewYear, viewMonth, dayNum);
        return {
          day: dayNum,
          month: viewMonth,
          year: viewYear,
          dow: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
          isToday: dayNum === now.getDate(),
          isTomorrow: dayNum === now.getDate() + 1,
        };
      });
    }

    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const d = new Date(viewYear, viewMonth, dayNum);
      const isToday =
        viewYear === now.getFullYear() &&
        viewMonth === now.getMonth() &&
        dayNum === now.getDate();
      const isTomorrow =
        viewYear === now.getFullYear() &&
        viewMonth === now.getMonth() &&
        dayNum === now.getDate() + 1;
      return {
        day: dayNum,
        month: viewMonth,
        year: viewYear,
        dow: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        isToday,
        isTomorrow,
      };
    });
  }, [viewYear, viewMonth, isCurrentMonth, showAllMonthDays, now]);

  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [viewYear, viewMonth]);

  const selectedDate = useMemo(() => new Date(viewYear, viewMonth, selectedDay), [viewYear, viewMonth, selectedDay]);
  const selectedDateIso = useMemo(() => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [viewYear, viewMonth, selectedDay]);

  const isSelectedToday = useMemo(() => {
    return (
      viewYear === now.getFullYear() &&
      viewMonth === now.getMonth() &&
      selectedDay === now.getDate()
    );
  }, [viewYear, viewMonth, selectedDay, now]);

  const isSelectedTomorrow = useMemo(() => {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return (
      viewYear === tomorrow.getFullYear() &&
      viewMonth === tomorrow.getMonth() &&
      selectedDay === tomorrow.getDate()
    );
  }, [viewYear, viewMonth, selectedDay, now]);

  const selectedDateLabel = useMemo(() => {
    if (isSelectedToday) return 'Today';
    if (isSelectedTomorrow) return 'Tomorrow';
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [isSelectedToday, isSelectedTomorrow, selectedDate]);

  // Filter tasks for the selected date on Your Timeline and sort chronologically by time shown
  const displayedTasks = useMemo(() => {
    const forDate = props.tasks.filter((task) =>
      isTaskOnSelectedDate(task, selectedDateIso, isSelectedToday, isSelectedTomorrow, selectedDate, selectedDay)
    );

    return [...forDate].sort((a, b) => {
      const timeDiff = getTimeSortValue(a) - getTimeSortValue(b);
      if (timeDiff !== 0) return timeDiff;
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [props.tasks, selectedDateIso, isSelectedToday, isSelectedTomorrow, selectedDate, selectedDay]);

  const isPastDate = useMemo(() => {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetMidnight = new Date(viewYear, viewMonth, selectedDay).getTime();
    return targetMidnight < todayMidnight;
  }, [now, viewYear, viewMonth, selectedDay]);

  const handleAddForSelectedDate = useCallback(() => {
    if (isPastDate) {
      props.onNotify?.('Cannot set reminders for past dates. Please pick today or a future date.');
      return;
    }
    if (isSelectedToday) {
      props.onAdd('today', 0);
    } else if (isSelectedTomorrow) {
      props.onAdd('tomorrow', 1);
    } else {
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetMidnight = new Date(viewYear, viewMonth, selectedDay);
      const diffDays = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        props.onAdd('custom', diffDays);
      } else {
        props.onAdd('today', 0);
      }
    }
  }, [isPastDate, isSelectedToday, isSelectedTomorrow, now, viewYear, viewMonth, selectedDay, props.onAdd, props.onNotify]);

  return (
    <View>
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>YOUR DAY, WITH CLARITY</Text>
          <Text style={styles.greetingTitle}>Good morning, <Text style={styles.greetingAccent}>{firstName}.</Text></Text>
          <Text style={styles.greetingSub}>A calmer way to keep every promise.</Text>
        </View>
        <Pressable onPress={props.onOpenAccount} style={styles.avatarLarge} accessibilityLabel="User Account Profile">
          <Text style={styles.avatarLetter}>{props.user?.avatarInitial || 'A'}</Text>
          <View style={styles.avatarStatus} />
        </Pressable>
      </View>

      <LinearGradient
        colors={['rgba(77,65,39,0.86)', 'rgba(39,33,23,0.96)', 'rgba(28,25,20,0.96)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={styles.heroTopline}>
          <View style={styles.heroPill}><Sparkles size={12} color={C.lime} /><Text style={styles.heroPillText}>DAILY FOCUS</Text></View>
          <Text style={styles.heroDate}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>
        <Text style={styles.heroTitle}>{'Catch it. Schedule it.\nGet it done.'}</Text>
        <Text style={styles.heroDescription}>Your messages hold commitments. Remindly keeps the important ones close.</Text>
        <View style={styles.heroBottomRow}>
          <View style={styles.heroStats}>
            <Text style={styles.heroCount}>{remaining.toString().padStart(2, '0')}</Text>
            <View>
              <Text style={styles.heroStatLabel}>TO FOLLOW UP</Text>
              <Text style={styles.heroStatHint}>{overdue ? `${overdue} needs attention` : 'You are on track'}</Text>
            </View>
          </View>
          <Pressable onPress={() => props.onAdd()} style={styles.heroAction}>
            <Plus size={18} color={C.black} /><Text style={styles.heroActionText}>Capture</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Functional Timeline Heading with Month & Year dropdown */}
      <View style={styles.sectionHeadingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Your timeline</Text>
          <Text style={styles.sectionSubtitle}>A little progress goes a long way.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isCurrentMonth && now.getDate() > 1 && (
            <Pressable
              style={styles.pastDaysToggle}
              onPress={() => setShowAllMonthDays((v) => !v)}
              accessibilityLabel={showAllMonthDays ? 'Show from today' : 'Show earlier days'}
            >
              <Text style={styles.pastDaysToggleText}>{showAllMonthDays ? 'From today' : 'Earlier'}</Text>
            </Pressable>
          )}
          <Pressable style={styles.dateMonthButton} onPress={() => setShowMonthPicker(true)} accessibilityLabel="Choose month and year">
            <Text style={styles.dateMonthText}>{monthLabel}</Text>
            <ChevronDown size={14} color={C.lime} />
          </Pressable>
        </View>
      </View>

      {/* Dynamic Month Days Scroller — Starts at current date by default */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {daysInMonth.map((date, idx) => {
          const selected = date.day === selectedDay && date.month === viewMonth;
          return (
            <Pressable
              key={`${date.year}-${date.month}-${date.day}-${idx}`}
              onPress={() => {
                setSelectedDay(date.day);
                if (date.month !== viewMonth) setViewMonth(date.month);
                if (date.year !== viewYear) setViewYear(date.year);
              }}
              style={[styles.dateTile, selected && styles.dateTileSelected, date.isToday && !selected && styles.dateTileToday]}
            >
              <Text style={[styles.dateNumber, selected && styles.dateNumberSelected]}>{date.day}</Text>
              <Text style={[styles.dateDay, selected && styles.dateDaySelected]}>{date.dow}</Text>
              {selected ? <View style={styles.dateIndicator} /> : date.isToday ? <View style={[styles.dateIndicator, { backgroundColor: C.lime }]} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeadingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Scheduled reminders</Text>
          <Text style={styles.sectionSubtitle}>
            {displayedTasks.length} {displayedTasks.length === 1 ? 'item' : 'items'} · {selectedDateLabel} · {isPastDate ? 'past date' : 'sorted by time'}
          </Text>
        </View>
        {!isPastDate && (
          <Pressable style={styles.smallIconButton} onPress={handleAddForSelectedDate} accessibilityLabel="Add reminder for this date">
            <Plus size={17} color={C.lime} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <FilterChip label="All reminders" active={props.filter === 'all'} onPress={() => props.setFilter('all')} />
        <FilterChip label="Important" active={props.filter === 'important'} onPress={() => props.setFilter('important')} />
        <FilterChip label="Notes" active={props.filter === 'notes'} onPress={() => props.setFilter('notes')} />
      </View>

      {displayedTasks.length === 0 ? (
        <EmptyState
          title={`No reminders for ${selectedDateLabel}`}
          subtitle={
            isSelectedToday
              ? 'Capture a commitment from a message, or enjoy a little breathing room.'
              : `No commitments scheduled for ${selectedDateLabel}. Tap + to add one.`
          }
          onAdd={handleAddForSelectedDate}
        />
      ) : (
        <View style={styles.timelineList}>
          {displayedTasks.map((task, index) => (
            <TaskTimelineRow
              key={task.id}
              task={task}
              index={index}
              onPress={() => props.onOpenTask(task)}
              onComplete={() => props.onCompleteTask(task)}
            />
          ))}
        </View>
      )}

      <Pressable style={styles.sourceInsight} onPress={() => props.onAdd()}>
        <View style={styles.sourceInsightIcon}><Link2 color={C.lime} size={18} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sourceInsightTitle}>A promise in a message?</Text>
          <Text style={styles.sourceInsightBody}>Share it here. Keep the context. Let us handle the follow-up.</Text>
        </View>
        <ArrowRight size={17} color={C.lime} />
      </Pressable>
      <View style={{ height: 20 }} />

      {/* Month Year Selector Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMonthPicker(false)}
            accessibilityLabel="Dismiss month picker"
          />
          <MonthYearPickerSheet
            currentYear={viewYear}
            currentMonth={viewMonth}
            onSelectMonthYear={(y: number, m: number) => {
              setViewYear(y);
              setViewMonth(m);
              setSelectedDay(1);
            }}
            onClose={() => setShowMonthPicker(false)}
            bottomInset={props.bottomInset}
          />
        </View>
      </Modal>
    </View>
  );
}

const FLOATING_NOTE_PALETTES = [
  { bg: '#DDF24B', fg: '#20240F', muted: '#535C2A', border: 'rgba(247,255,182,0.78)', accent: '#8A9825', iconBg: 'rgba(18,28,12,0.09)', shadow: '#D7EF48', gradient: ['#E9F98A', '#D7ED3E'] as [string, string] },
  { bg: '#DCE7D8', fg: '#1A3020', muted: '#526653', border: 'rgba(255,255,255,0.64)', accent: '#78916F', iconBg: 'rgba(20,50,28,0.07)', shadow: '#8D9F83', gradient: ['#EAF1E4', '#CFDDCE'] as [string, string] },
  { bg: '#F0E7D6', fg: '#30251A', muted: '#796A57', border: 'rgba(255,255,255,0.58)', accent: '#B48B52', iconBg: 'rgba(48,37,26,0.07)', shadow: '#AA9270', gradient: ['#F7EFDF', '#E6D9C2'] as [string, string] },
  { bg: '#302820', fg: '#F6F0E5', muted: '#BEB09A', border: 'rgba(255,244,220,0.22)', accent: '#D6D88A', iconBg: 'rgba(255,255,255,0.075)', shadow: '#050504', gradient: ['rgba(65,55,42,0.98)', 'rgba(35,29,23,0.98)'] as [string, string] },
];

function TaskTimelineRow({ task, index, onPress, onComplete }: { task: OmniTask; index: number; onPress: () => void; onComplete: () => void }) {
  const urgent = task.status === 'overdue';
  const palette = urgent ? FLOATING_NOTE_PALETTES[0] : FLOATING_NOTE_PALETTES[index % 3];
  const rotation = ['-0.85deg', '0.45deg', '-0.35deg', '0.7deg'][index % 4];
  const organicCorners = index % 3 === 0
    ? { borderTopLeftRadius: 25, borderTopRightRadius: 18, borderBottomRightRadius: 27, borderBottomLeftRadius: 20 }
    : index % 3 === 1
      ? { borderTopLeftRadius: 18, borderTopRightRadius: 27, borderBottomRightRadius: 20, borderBottomLeftRadius: 25 }
      : { borderTopLeftRadius: 23, borderTopRightRadius: 21, borderBottomRightRadius: 28, borderBottomLeftRadius: 18 };
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineTimeCol}>
        <Text style={[styles.timelineTime, { color: urgent ? C.lime : C.ink2 }]}>{task.timeLabel.split(' ').slice(0, 1).join(' ')}</Text>
        <Text style={styles.timelineAmPm}>{task.timeLabel.split(' ').slice(1).join(' ') || ''}</Text>
      </View>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, urgent && styles.timelineDotUrgent]} />
        {index < 10 ? <View style={styles.timelineLine} /> : null}
      </View>
      <Pressable
        onPress={onPress}
        accessibilityLabel={`Open reminder: ${task.title}`}
        style={({ pressed }) => [
          styles.floatingNoteCard,
          { backgroundColor: palette.bg, borderColor: palette.border, shadowColor: palette.shadow, ...organicCorners, transform: [{ translateY: index % 2 === 0 ? 0 : 2 }, { rotate: rotation }, { scale: pressed ? 0.986 : 1 }] },
          pressed && { opacity: 0.96 },
        ]}
      >
        <LinearGradient pointerEvents="none" colors={palette.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.noteTopSheen} />
        <View pointerEvents="none" style={styles.noteAmbientOrb} />
        <View style={[styles.floatingNoteAccent, { backgroundColor: palette.accent }]} />
        <View style={styles.floatingNoteHeader}>
          <View style={[styles.floatingNoteSourceIcon, { backgroundColor: palette.iconBg }]}>{sourceIcon(task.source, 17, palette.fg)}</View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[styles.floatingNoteSource, { color: palette.muted }]}>{task.source.toUpperCase()} · {task.dateLabel.toUpperCase()}</Text>
            {task.important ? <View style={styles.floatingNoteImportant}><Flame size={10} color={urgent ? palette.fg : palette.accent} /><Text style={[styles.floatingNoteImportantText, { color: palette.fg }]}>IMPORTANT</Text></View> : null}
          </View>
          <Pressable
            onPress={onComplete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${task.title} complete`}
            style={[styles.floatingNoteComplete, { borderColor: `${palette.fg}55`, backgroundColor: palette.iconBg }]}
          >
            <Check size={15} color={palette.fg} />
          </Pressable>
        </View>
        <Text numberOfLines={2} style={[styles.floatingNoteTitle, { color: palette.fg }]}>{task.title}</Text>
        <Text numberOfLines={2} style={[styles.floatingNoteExcerpt, { color: palette.muted }]}>{task.excerpt}</Text>
        <View style={[styles.floatingNoteFooter, { borderTopColor: `${palette.fg}22` }]}>
          <View style={styles.floatingNoteDeadline}><Clock3 size={12} color={palette.fg} /><Text style={[styles.floatingNoteDeadlineText, { color: palette.fg }]}>{urgent ? 'OVERDUE' : task.timeLabel}</Text></View>
          <View style={styles.floatingNoteOpen}><Text style={{ color: palette.fg, fontSize: 9, fontWeight: '800' }}>Open note</Text><ArrowRight size={12} color={palette.fg} /></View>
        </View>
      </Pressable>
    </View>
  );
}

function CalendarScreen({ tasks, onOpenTask, onAdd }: { tasks: OmniTask[]; onOpenTask: (task: OmniTask) => void; onAdd: (mode: CaptureDateMode, offset: number) => void }) {
  const [week, setWeek] = useState(0);
  const [selectedDayOffset, setSelectedDayOffset] = useState(() => (new Date().getDay() + 6) % 7);
  const weekDays = useMemo(() => {
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset + week * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const isToday = date.toDateString() === today.toDateString();
      const isTomorrow = date.toDateString() === new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toDateString();
      return {
        date,
        day: date.getDate(),
        weekday: date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        label: isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        isToday,
        isTomorrow,
      };
    });
  }, [week]);
  const activeDay = weekDays[selectedDayOffset] ?? weekDays[0];
  const isCalPastDay = useMemo(() => {
    if (!activeDay) return false;
    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const activeMid = new Date(activeDay.date.getFullYear(), activeDay.date.getMonth(), activeDay.date.getDate()).getTime();
    return activeMid < todayMid;
  }, [activeDay]);
  const tasksForDay = useMemo(() => {
    if (!activeDay) return [];
    const targetIso = `${activeDay.date.getFullYear()}-${String(activeDay.date.getMonth() + 1).padStart(2, '0')}-${String(activeDay.date.getDate()).padStart(2, '0')}`;
    const filtered = tasks.filter((task) => {
      if (task.status === 'inbox' || task.status === 'done') return false;
      return isTaskOnSelectedDate(task, targetIso, activeDay.isToday, activeDay.isTomorrow, activeDay.date, activeDay.day);
    });
    return [...filtered].sort((a, b) => {
      const timeDiff = getTimeSortValue(a) - getTimeSortValue(b);
      if (timeDiff !== 0) return timeDiff;
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [tasks, activeDay]);
  const addForSelectedDate = () => {
    if (isCalPastDay) return;
    const selection = captureDateSelection(activeDay.date);
    onAdd(selection.mode, selection.offset);
  };
  const heading = week === 0 ? 'This week' : week === -1 ? 'Last week' : week === 1 ? 'Next week' : `${week > 0 ? '+' : ''}${week} weeks`;

  return (
    <View>
      <View style={styles.rPageIntro}>
        <Text style={styles.eyebrow}>A LITTLE SPACE TO PLAN</Text>
        <Text style={styles.rPageTitle}>Your calendar</Text>
        <Text style={styles.rPageSubtitle}>A clear view of what is coming up, with the context still attached.</Text>
      </View>

      <View style={styles.rCalendarWeekHeader}>
        <Pressable accessibilityLabel="Previous week" onPress={() => { setWeek((v) => v - 1); setSelectedDayOffset(0); }} style={styles.rRoundArrow}><ChevronLeft size={17} color={C.ink2} /></Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.rWeekHeading}>{heading}</Text>
          <Text style={styles.rWeekRange}>{weekDays[0]?.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {weekDays[6]?.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
        </View>
        <Pressable accessibilityLabel="Next week" onPress={() => { setWeek((v) => v + 1); setSelectedDayOffset(0); }} style={styles.rRoundArrow}><ChevronRight size={17} color={C.ink2} /></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rCalendarDays}>
        {weekDays.map((item, index) => {
          const selected = selectedDayOffset === index;
          return (
            <Pressable key={item.date.toISOString()} onPress={() => setSelectedDayOffset(index)} style={[styles.rCalendarDay, selected && styles.rCalendarDayActive, item.isToday && !selected && styles.rCalendarDayToday]}>
              <Text style={[styles.rCalendarDow, selected && styles.rCalendarDowActive]}>{item.weekday.slice(0, 2)}</Text>
              <Text style={[styles.rCalendarNum, selected && styles.rCalendarNumActive]}>{item.day}</Text>
              <View style={[styles.rCalendarDayDot, selected && styles.rCalendarDayDotActive, item.isToday && !selected && styles.rCalendarDayDotToday]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.rCalendarPulse}>
        <View style={styles.rCalendarPulseGlow} />
        <View style={styles.rCalendarMetric}><Text style={styles.rCalendarMetricNumber}>{tasks.filter((t) => t.status === 'overdue').length}</Text><Text style={styles.rCalendarMetricLabel}>OVERDUE</Text></View>
        <View style={styles.rCalendarMetricRule} />
        <View style={styles.rCalendarMetric}><Text style={styles.rCalendarMetricNumber}>{tasks.filter((t) => t.status === 'upcoming').length}</Text><Text style={styles.rCalendarMetricLabel}>UPCOMING</Text></View>
        <View style={styles.rCalendarMetricRule} />
        <View style={styles.rCalendarMetric}><Text style={styles.rCalendarMetricNumber}>{tasks.filter((t) => t.status === 'done').length}</Text><Text style={styles.rCalendarMetricLabel}>DONE</Text></View>
      </View>

      <View style={styles.rCalendarListHeading}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rSectionTitle}>{activeDay?.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          <Text style={styles.rSectionSubtitle}>
            {isCalPastDay
              ? 'Past date · Scheduling unavailable'
              : tasksForDay.length
              ? `${tasksForDay.length} reminder${tasksForDay.length === 1 ? '' : 's'} to keep close`
              : 'A little breathing room is a good thing.'}
          </Text>
        </View>
        {!isCalPastDay && (
          <Pressable onPress={addForSelectedDate} style={styles.rAddRound}><Plus size={17} color={C.black} /></Pressable>
        )}
      </View>

      {tasksForDay.length ? (
        <View style={styles.rCalendarList}>
          {tasksForDay.map((task) => (
            <Pressable key={task.id} onPress={() => onOpenTask(task)} style={({ pressed }) => [styles.rCalendarTask, pressed && { opacity: 0.86, transform: [{ scale: 0.992 }] }]}>
              <View style={[styles.rCalendarTimeRail, task.status === 'overdue' && styles.rCalendarTimeRailUrgent]}>
                <Text style={[styles.rCalendarTimeLabel, task.status === 'overdue' && styles.rCalendarTimeLabelUrgent]}>{task.timeLabel.replace(' AM', '').replace(' PM', '')}</Text>
                <Text style={[styles.rCalendarTimeSuffix, task.status === 'overdue' && styles.rCalendarTimeSuffixUrgent]}>{task.timeLabel.includes('PM') ? 'PM' : task.timeLabel.includes('AM') ? 'AM' : ''}</Text>
              </View>
              <View style={styles.rCalendarTaskBody}>
                <View style={styles.rCalendarTaskMeta}>{sourceIcon(task.source, 13, task.status === 'overdue' ? C.lime : C.muted)}<Text style={styles.rCalendarSource}>{task.source.toUpperCase()}</Text>{task.important ? <View style={styles.rImportantDot} /> : null}</View>
                <Text style={styles.rCalendarTaskTitle}>{task.title}</Text>
                <Text style={styles.rCalendarTaskExcerpt} numberOfLines={1}>{task.excerpt}</Text>
              </View>
              <ChevronRight size={16} color={C.muted2} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.rCalendarEmpty}>
          <View style={styles.rCalendarEmptyGlyph}><CalendarDays size={21} color={C.lime} /></View>
          <Text style={styles.rCalendarEmptyTitle}>Nothing scheduled here.</Text>
          <Text style={styles.rCalendarEmptyBody}>{week === 0 && activeDay?.isToday ? 'Your day is clear. Capture a commitment whenever one comes in.' : 'Capture a reminder for this date whenever you need one.'}</Text>
          {!isCalPastDay && (
            <Pressable onPress={addForSelectedDate} style={styles.rCalendarEmptyAction}><Plus size={15} color={C.black} /><Text style={styles.rCalendarEmptyActionText}>Add reminder</Text></Pressable>
          )}
        </View>
      )}
      <View style={styles.rCalendarBottomNote}><ShieldCheck size={13} color={C.muted} /><Text style={styles.rCalendarBottomNoteText}>Dates are shown in your device’s local time.</Text></View>
    </View>
  );
}

function InboxScreen({ tasks, onOpenTask, onAdd }: { tasks: OmniTask[]; onOpenTask: (task: OmniTask) => void; onAdd: () => void }) {
  const [sourceFilter, setSourceFilter] = useState<'All' | TaskSource>('All');
  const sourceFilters: ('All' | TaskSource)[] = ['All', 'WhatsApp', 'Outlook', 'Gmail', 'Slack', 'Telegram', 'Notes', 'Web', 'Manual', 'Other'];
  const inboxTasks = sourceFilter === 'All' ? tasks : tasks.filter((task) => task.source === sourceFilter);
  return (
    <View>
      <View style={styles.rPageIntro}>
        <Text style={styles.eyebrow}>CAPTURE NOW. DECIDE WHEN READY.</Text>
        <View style={styles.rInboxTitleRow}>
          <View style={{ flex: 1 }}><Text style={styles.rPageTitle}>Your inbox</Text><Text style={styles.rPageSubtitle}>Loose ends can wait here until you are ready to give them a date.</Text></View>
          <View style={styles.rInboxCount}><Text style={styles.rInboxCountNumber}>{tasks.length.toString().padStart(2, '0')}</Text><Text style={styles.rInboxCountLabel}>TO SORT</Text></View>
        </View>
      </View>

      <View style={styles.rInboxPrinciple}>
        <View style={styles.rInboxPrincipleIcon}><ShieldCheck size={18} color={C.lime} /></View>
        <View style={{ flex: 1 }}><Text style={styles.rInboxPrincipleTitle}>Nothing gets guessed.</Text><Text style={styles.rInboxPrincipleText}>Review the wording and confirm a deadline before it becomes a reminder.</Text></View>
        <View style={styles.rPrincipleSpark}><Sparkles size={17} color={C.lime} /></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rInboxFilters}>
        {sourceFilters.map((source) => {
          const active = sourceFilter === source;
          const count = source === 'All' ? tasks.length : tasks.filter((task) => task.source === source).length;
          return <Pressable key={source} onPress={() => setSourceFilter(source)} style={[styles.rInboxFilter, active && styles.rInboxFilterActive]}><Text style={[styles.rInboxFilterText, active && styles.rInboxFilterTextActive]}>{source}</Text><Text style={[styles.rInboxFilterCount, active && styles.rInboxFilterCountActive]}>{count}</Text></Pressable>;
        })}
      </ScrollView>

      <View style={styles.rInboxListHeader}><View><Text style={styles.rSectionTitle}>{sourceFilter === 'All' ? 'Captured messages' : `${sourceFilter} captures`}</Text><Text style={styles.rSectionSubtitle}>{inboxTasks.length ? 'Your context stays attached to every capture.' : 'No messages from this source yet.'}</Text></View><Pressable onPress={onAdd} style={styles.rRoundArrow}><Plus size={17} color={C.ink2} /></Pressable></View>

      {inboxTasks.length ? (
        <View style={styles.rInboxList}>
          {inboxTasks.map((task, index) => {
            const accent =
              task.source === 'WhatsApp' ? '#B4CB76' :
              task.source === 'Outlook' ? '#6BB4EC' :
              task.source === 'Gmail' ? '#DBA06D' :
              task.source === 'Slack' ? '#BAA2DC' :
              task.source === 'Telegram' ? '#5DC2DE' :
              task.source === 'Web' ? '#65D2B8' :
              task.source === 'Notes' ? '#E2CA74' :
              task.source === 'Other' ? '#B0BAC4' :
              '#8EB6A2';
            return (
              <Pressable key={task.id} onPress={() => onOpenTask(task)} style={({ pressed }) => [styles.rInboxCard, index % 2 === 1 && styles.rInboxCardOffset, pressed && { opacity: 0.88, transform: [{ scale: 0.992 }] }]}>
                <LinearGradient pointerEvents="none" colors={['rgba(64,55,41,0.78)', 'rgba(31,27,22,0.91)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View pointerEvents="none" style={styles.rInboxCardSheen} />
                <View style={[styles.rInboxCardAccent, { backgroundColor: accent }]} />
                <View style={styles.rInboxCardHeader}><View style={[styles.rInboxSourceIcon, { backgroundColor: `${accent}19` }]}>{sourceIcon(task.source, 15, accent)}</View><View style={{ flex: 1 }}><Text style={styles.rInboxSourceName}>{task.source.toUpperCase()} · SAVED LOCALLY</Text><Text style={styles.rInboxWhen}>Captured {index === 0 ? 'just now' : 'earlier'}</Text></View><View style={styles.rInboxNeedsDate}><View style={[styles.rInboxNeedsDateDot, { backgroundColor: accent }]} /><Text style={styles.rInboxNeedsDateText}>NEEDS A DATE</Text></View></View>
                <Text style={styles.rInboxTaskTitle}>{task.title}</Text>
                <Text style={styles.rInboxTaskExcerpt} numberOfLines={3}>{task.excerpt}</Text>
                <View style={styles.rInboxCardFooter}><View style={styles.rInboxAction}><CalendarDays size={14} color={C.lime} /><Text style={styles.rInboxActionText}>Review & set date</Text></View><View style={styles.rInboxOpen}><Text style={styles.rInboxOpenText}>Open capture</Text><ArrowRight size={14} color={C.muted} /></View></View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.rInboxEmpty}><View style={styles.rInboxEmptyIcon}><Inbox size={22} color={C.lime} /></View><Text style={styles.rInboxEmptyTitle}>{sourceFilter === 'All' ? 'A clear inbox.' : `No ${sourceFilter} captures yet.`}</Text><Text style={styles.rInboxEmptyText}>Share a message or add a note. You can sort it when you have a moment.</Text><Pressable onPress={onAdd} style={styles.rInboxEmptyButton}><Plus size={15} color={C.black} /><Text style={styles.rInboxEmptyButtonText}>Capture something</Text></Pressable></View>
      )}

      <Pressable onPress={onAdd} style={styles.rInboxAddAnother}><View style={styles.rInboxAddPlus}><Plus size={18} color={C.black} /></View><View style={{ flex: 1 }}><Text style={styles.rInboxAddTitle}>Another thought to catch?</Text><Text style={styles.rInboxAddSubtitle}>Start with the message. Sort the details later.</Text></View><ArrowRight size={17} color={C.lime} /></Pressable>
      <View style={{ height: 14 }} />
    </View>
  );
}

function ActivityScreen({ tasks, onOpenTask }: { tasks: OmniTask[]; onOpenTask: (task: OmniTask) => void }) {
  return (
    <View>
      <Text style={styles.eyebrow}>YOUR FOLLOW-THROUGH, AT A GLANCE</Text>
      <Text style={styles.pageTitle}>Activity</Text>
      <Text style={styles.pageSubtitle}>Recent reminders that need attention or were completed.</Text>
      <View style={styles.activityHero}>
        <CheckCircle2 color={C.lime} size={23} />
        <View style={{ flex: 1 }}><Text style={styles.activityHeroTitle}>Progress over pressure.</Text><Text style={styles.activityHeroBody}>Rescheduling is a valid next step. Keep moving.</Text></View>
      </View>
      {tasks.map((task) => <Pressable key={task.id} onPress={() => onOpenTask(task)} style={styles.activityRow}>{task.status === 'done' ? <CheckCircle2 color={C.green} size={20} /> : <Clock3 color={C.lime} size={20} />}<View style={{ flex: 1 }}><Text style={styles.activityTaskTitle}>{task.title}</Text><Text style={styles.activityTaskSubtitle}>{task.status === 'done' ? 'Completed' : 'Needs attention'} · {task.source}</Text></View><ChevronRight color={C.muted} size={17} /></Pressable>)}
      {!tasks.length ? <EmptyState title="A clean slate" subtitle="Finished reminders will appear here." /> : null}
    </View>
  );
}

function SettingsScreen({
  quietHours,
  onQuietHours,
  defaultProfile,
  onDefaultProfileChange,
  dateOnlyTime,
  onDateOnlyTimeChange,
  testSent,
  onTest,
  onOnboarding,
  notificationsAllowed,
  onOpenNotificationSettings,
  notificationsSound,
  onNotificationsSoundChange,
  notificationsVibration,
  onNotificationsVibrationChange,
  persistentFollowups,
  onPersistentFollowupsChange,
  lockScreenPrivacy,
  onLockScreenPrivacyChange,
  quickCaptureAnywhere,
  onQuickCaptureAnywhereToggle,
  overlayPermissionGranted,
  onGrantOverlayPermission,
  onStopOverlayService,
}: {
  quietHours: boolean;
  onQuietHours: (v: boolean) => void;
  defaultProfile: ProfileKey;
  onDefaultProfileChange: (profile: ProfileKey) => void;
  dateOnlyTime: string;
  onDateOnlyTimeChange: (time: string) => void;
  testSent: boolean;
  onTest: () => void;
  onOnboarding: () => void;
  notificationsAllowed?: boolean;
  onOpenNotificationSettings?: () => void;
  notificationsSound: boolean;
  onNotificationsSoundChange: (v: boolean) => void;
  notificationsVibration: boolean;
  onNotificationsVibrationChange: (v: boolean) => void;
  persistentFollowups: boolean;
  onPersistentFollowupsChange: (v: boolean) => void;
  lockScreenPrivacy: boolean;
  onLockScreenPrivacyChange: (v: boolean) => void;
  quickCaptureAnywhere?: boolean;
  onQuickCaptureAnywhereToggle?: (v: boolean) => void;
  overlayPermissionGranted?: boolean;
  onGrantOverlayPermission?: () => void;
  onStopOverlayService?: () => void;
}) {
  const [showProfiles, setShowProfiles] = useState(false);
  const times = ['08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM'];
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  return (
    <View>
      <View style={styles.rSettingsIntro}>
        <Text style={styles.eyebrow}>YOUR ROUTINE, YOUR RULES</Text>
        <Text style={styles.rSettingsTitle}>Make it feel like yours.</Text>
        <Text style={styles.rSettingsSubtitle}>A few thoughtful defaults make every captured promise easier to keep.</Text>
        <View style={styles.rSettingsLocalBadge}><View style={styles.rSettingsLocalDot} /><ShieldCheck size={13} color={C.green} /><Text style={styles.rSettingsLocalText}>LOCAL-FIRST BY DESIGN</Text></View>
      </View>

      <View style={styles.rSettingsSectionHeading}><View><Text style={styles.rSectionTitle}>Reminder rhythm</Text><Text style={styles.rSectionSubtitle}>Choose how Remindly nudges you.</Text></View><Pressable onPress={() => setShowProfiles((v) => !v)} style={styles.rTinyLink}><Text style={styles.rTinyLinkText}>{showProfiles ? 'Hide profiles' : 'All profiles'}</Text><ChevronRight size={13} color={C.lime} /></Pressable></View>
      <Pressable onPress={() => setShowProfiles((v) => !v)} style={styles.rDefaultProfileCard}>
        <LinearGradient pointerEvents="none" colors={['rgba(224,243,74,0.12)', 'rgba(224,243,74,0.025)', 'rgba(255,255,255,0.018)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.rDefaultProfileIcon}><Bell size={19} color={C.lime} /></View>
        <View style={{ flex: 1 }}><Text style={styles.rDefaultProfileOverline}>DEFAULT PROFILE</Text><Text style={styles.rDefaultProfileTitle}>{defaultProfile}</Text><Text style={styles.rDefaultProfileDescription}>{PROFILE_DESCRIPTIONS[defaultProfile]}</Text></View>
        <View style={styles.rDefaultProfileChange}><Text style={styles.rDefaultProfileChangeText}>{showProfiles ? 'Close' : 'Change'}</Text><ChevronDown size={14} color={C.lime} /></View>
      </Pressable>

      {showProfiles ? (
        <View style={styles.rProfileGrid}>
          {(['Simple', 'Standard', 'Important', 'Persistent'] as ProfileKey[]).map((profile) => {
            const chosen = defaultProfile === profile;
            const accent = profile === 'Important' ? C.lime : profile === 'Persistent' ? '#D9B57D' : profile === 'Simple' ? '#9DBBA5' : '#B8B3A6';
            return (
              <Pressable key={profile} onPress={() => { onDefaultProfileChange(profile); setShowProfiles(false); }} style={[styles.rProfileChoice, chosen && styles.rProfileChoiceSelected]}>
                <View style={[styles.rProfileChoiceMark, { backgroundColor: chosen ? accent : 'rgba(255,255,255,0.045)' }]}>{chosen ? <Check size={14} color={C.black} /> : <Bell size={13} color={accent} />}</View>
                <Text style={[styles.rProfileChoiceTitle, chosen && { color: C.lime }]}>{profile}</Text>
                <Text style={styles.rProfileChoiceDetail}>{PROFILE_DESCRIPTIONS[profile]}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.rSettingsOptions}>
        <View style={styles.rSettingsOptionRow}>
          <View style={styles.rSettingsOptionIcon}><Clock3 size={17} color={C.lime} /></View>
          <View style={{ flex: 1 }}><Text style={styles.rSettingsOptionTitle}>Date-only time</Text><Text style={styles.rSettingsOptionDetail}>Used when a message gives a day but no time.</Text></View>
          <Pressable accessibilityLabel="Change date-only reminder time" onPress={() => onDateOnlyTimeChange(times[(times.findIndex((time) => time.replace(/^0/, '') === dateOnlyTime.replace(/^0/, '')) + 1) % times.length])} style={styles.rTimeSelector}><Text style={styles.rTimeSelectorText}>{dateOnlyTime}</Text><ChevronDown size={13} color={C.lime} /></Pressable>
        </View>

        <View style={styles.rSettingsOptionDivider} />

        <View style={styles.rSettingsOptionRow}>
          <View style={[styles.rSettingsOptionIcon, quietHours && styles.rSettingsOptionIconActive]}><Moon size={17} color={quietHours ? C.lime : C.muted} /></View>
          <View style={{ flex: 1 }}><Text style={styles.rSettingsOptionTitle}>Quiet hours</Text><Text style={styles.rSettingsOptionDetail}>{quietHours ? 'Non-urgent & follow-up alerts pause from 10 PM to 8 AM (deferred to 8 AM). Due alerts still sound.' : 'Reminders notify you at any hour.'}</Text></View>
          <Switch value={quietHours} onValueChange={onQuietHours} trackColor={{ false: '#514B41', true: C.limeDark }} thumbColor={quietHours ? C.lime : '#B8B0A1'} accessibilityLabel="Quiet hours" />
        </View>

        <View style={styles.rSettingsOptionDivider} />

        <View style={styles.rSettingsOptionRow}>
          <View style={[styles.rSettingsOptionIcon, notificationsSound && styles.rSettingsOptionIconActive]}><Bell size={17} color={notificationsSound ? C.lime : C.muted} /></View>
          <View style={{ flex: 1 }}><Text style={styles.rSettingsOptionTitle}>Notification sounds</Text><Text style={styles.rSettingsOptionDetail}>{notificationsSound ? 'Alerts play device notification sounds.' : 'Alerts arrive silently without chime.'}</Text></View>
          <Switch value={notificationsSound} onValueChange={onNotificationsSoundChange} trackColor={{ false: '#514B41', true: C.limeDark }} thumbColor={notificationsSound ? C.lime : '#B8B0A1'} accessibilityLabel="Notification sounds" />
        </View>

        <View style={styles.rSettingsOptionDivider} />

        <View style={styles.rSettingsOptionRow}>
          <View style={[styles.rSettingsOptionIcon, notificationsVibration && styles.rSettingsOptionIconActive]}><Vibrate size={17} color={notificationsVibration ? C.lime : C.muted} /></View>
          <View style={{ flex: 1 }}><Text style={styles.rSettingsOptionTitle}>Vibration feedback</Text><Text style={styles.rSettingsOptionDetail}>{Platform.OS === 'android' ? 'Android channels: single pulse for reminders, 2-pulse for Important deadlines.' : 'iOS uses platform-managed haptic vibration.'}</Text></View>
          <Switch value={notificationsVibration} onValueChange={onNotificationsVibrationChange} trackColor={{ false: '#514B41', true: C.limeDark }} thumbColor={notificationsVibration ? C.lime : '#B8B0A1'} accessibilityLabel="Vibration feedback" />
        </View>

        <View style={styles.rSettingsOptionDivider} />

        <View style={styles.rSettingsOptionRow}>
          <View style={[styles.rSettingsOptionIcon, persistentFollowups && styles.rSettingsOptionIconActive]}><Clock3 size={17} color={persistentFollowups ? C.lime : C.muted} /></View>
          <View style={{ flex: 1 }}><Text style={styles.rSettingsOptionTitle}>Persistent follow-ups</Text><Text style={styles.rSettingsOptionDetail}>{persistentFollowups ? 'Allows up to 2 bounded follow-ups (+15m, +60m) after missed deadline.' : 'Follow-up alerts disabled. Only scheduled milestones fire.'}</Text></View>
          <Switch value={persistentFollowups} onValueChange={onPersistentFollowupsChange} trackColor={{ false: '#514B41', true: C.limeDark }} thumbColor={persistentFollowups ? C.lime : '#B8B0A1'} accessibilityLabel="Persistent follow-ups" />
        </View>

        <View style={styles.rSettingsOptionDivider} />

        <View style={styles.rSettingsOptionRow}>
          <View style={[styles.rSettingsOptionIcon, lockScreenPrivacy && styles.rSettingsOptionIconActive]}><ShieldCheck size={17} color={lockScreenPrivacy ? C.lime : C.muted} /></View>
          <View style={{ flex: 1 }}><Text style={styles.rSettingsOptionTitle}>Lock-screen privacy</Text><Text style={styles.rSettingsOptionDetail}>{lockScreenPrivacy ? 'Shows generic "Reminder due" on lock screen to protect sensitive message content.' : 'Shows reminder title and milestone details on lock screen.'}</Text></View>
          <Switch value={lockScreenPrivacy} onValueChange={onLockScreenPrivacyChange} trackColor={{ false: '#514B41', true: C.limeDark }} thumbColor={lockScreenPrivacy ? C.lime : '#B8B0A1'} accessibilityLabel="Lock screen privacy" />
        </View>
      </View>

      <View style={styles.rSettingsSectionHeading}>
        <View>
          <Text style={styles.rSectionTitle}>Quick Capture Anywhere</Text>
          <Text style={styles.rSectionSubtitle}>Capture reminders directly from WhatsApp, Chrome, or any app.</Text>
        </View>
      </View>
      <View style={styles.rSettingsOptions}>
        <View style={styles.rSettingsOptionRow}>
          <View style={[styles.rSettingsOptionIcon, quickCaptureAnywhere && styles.rSettingsOptionIconActive]}>
            <ExternalLink size={17} color={quickCaptureAnywhere ? C.lime : C.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rSettingsOptionTitle}>Floating capture button</Text>
            <Text style={styles.rSettingsOptionDetail}>
              {quickCaptureAnywhere
                ? 'Active. Tap the floating Remindly button above other apps to capture reminders instantly.'
                : 'Disabled. Remindly stays inside its own window.'}
            </Text>
          </View>
          <Switch
            value={Boolean(quickCaptureAnywhere)}
            onValueChange={onQuickCaptureAnywhereToggle}
            trackColor={{ false: '#514B41', true: C.limeDark }}
            thumbColor={quickCaptureAnywhere ? C.lime : '#B8B0A1'}
            accessibilityLabel="Toggle Quick Capture Anywhere"
          />
        </View>

        <View style={styles.rSettingsOptionDivider} />

        <View style={styles.rSettingsOptionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rSettingsOptionTitle}>Overlay permission</Text>
            <Text style={styles.rSettingsOptionDetail}>
              {overlayPermissionGranted
                ? 'Permission granted. Android allows Remindly to display a floating button over other apps.'
                : 'Action required. Android requires "Display over other apps" access to show the floating button.'}
            </Text>
          </View>
          <Pressable
            onPress={onGrantOverlayPermission}
            style={[styles.rPermissionActionBtn, overlayPermissionGranted && styles.rPermissionActionBtnGranted]}
          >
            <Text style={[styles.rPermissionActionBtnText, overlayPermissionGranted && styles.rPermissionActionBtnTextGranted]}>
              {overlayPermissionGranted ? 'Granted ✓' : 'Grant Access'}
            </Text>
          </Pressable>
        </View>

        {quickCaptureAnywhere ? (
          <>
            <View style={styles.rSettingsOptionDivider} />
            <View style={styles.rSettingsOptionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rSettingsOptionTitle}>Stop overlay service</Text>
                <Text style={styles.rSettingsOptionDetail}>Dismisses the floating button and terminates the background foreground service.</Text>
              </View>
              <Pressable onPress={onStopOverlayService} style={styles.rStopServiceBtn}>
                <Text style={styles.rStopServiceBtnText}>Stop Service</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.rSettingsSectionHeading}><View><Text style={styles.rSectionTitle}>Delivery & permissions</Text><Text style={styles.rSectionSubtitle}>The device controls the final notification step.</Text></View></View>
      <View style={styles.rDeliveryCard}>
        <View style={styles.rDeliveryTop}>
          <View style={[styles.rDeliveryIcon, notificationsAllowed === false && { backgroundColor: 'rgba(235,94,85,0.12)' }]}>
            <Bell size={18} color={notificationsAllowed === false ? '#EB5E55' : C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rDeliveryTitle}>Notification readiness</Text>
            <Text style={styles.rDeliverySubtitle}>
              {notificationsAllowed === false
                ? 'Notifications are disabled in system settings. Reminders will save locally, but native alerts will not sound.'
                : notificationsAllowed === true
                ? 'Device-local notifications armed. Alarms trigger on device using native channels.'
                : 'Verifying notification permissions with device...'}
            </Text>
            {notificationsAllowed === false && onOpenNotificationSettings ? (
              <Pressable onPress={onOpenNotificationSettings} style={styles.rSettingsPermissionButton}>
                <Text style={styles.rSettingsPermissionButtonText}>Open System Settings</Text>
                <ExternalLink size={11} color={C.lime} />
              </Pressable>
            ) : null}
          </View>
          <View style={[styles.rDeliveryStatusDot, { backgroundColor: notificationsAllowed === false ? '#EB5E55' : notificationsAllowed === true ? C.green : C.amber }]} />
        </View>
        <View style={styles.rDeliveryRule} />
        <View style={styles.rDeliveryFoot}>
          <View style={styles.rDemoTag}>
            <View style={[styles.rDemoTagDot, { backgroundColor: notificationsAllowed === false ? '#EB5E55' : C.green }]} />
            <Text style={styles.rDemoTagText}>
              {notificationsAllowed === false ? 'PERMISSION REQUIRED' : 'LOCAL ENGINE READY'}
            </Text>
          </View>
          <Pressable onPress={onTest} style={styles.rTestButton}>
            {testSent ? <ActivityIndicator color={C.black} size="small" /> : <Bell size={14} color={C.black} />}
            <Text style={styles.rTestButtonText}>{testSent ? 'Scheduling…' : 'Test reminder'}</Text>
            <ArrowRight size={14} color={C.black} />
          </Pressable>
        </View>
        <Text style={styles.rDeliveryDisclaimer}>
          {Platform.OS === 'android'
            ? 'Android uses "Standard Reminders" [0, 160ms] & "Important Deadlines" [0, 120, 100, 180ms] channels.'
            : 'iOS delivers notifications with platform-managed haptics and native sounds.'}
        </Text>
      </View>

      <View style={styles.rSettingsSectionHeading}><View><Text style={styles.rSectionTitle}>Look & feel</Text><Text style={styles.rSectionSubtitle}>A little atmosphere, without losing legibility.</Text></View></View>
      <View style={styles.rAppearanceCard}>
        <View style={styles.rAppearanceVisual}>
          <LinearGradient colors={['#181510', '#30291E', '#657044']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.rAppearanceGlow} /><View style={styles.rAppearanceMiniCard}><View style={styles.rAppearanceMiniDot} /><View style={styles.rAppearanceMiniLineLong} /><View style={styles.rAppearanceMiniLineShort} /></View><View style={styles.rAppearanceMiniDock}><View /><View /><View style={styles.rAppearanceMiniDockActive} /><View /></View>
        </View>
        <View style={{ flex: 1 }}><Text style={styles.rAppearanceTitle}>Obsidian glow</Text><Text style={styles.rAppearanceSubtitle}>Smoked glass · warm light · chartreuse.</Text><Text style={styles.rAppearanceNote}>Current theme</Text></View><CheckCircle2 size={19} color={C.lime} />
      </View>

      <View style={styles.rSettingsSectionHeading}><View><Text style={styles.rSectionTitle}>Your data stays yours</Text><Text style={styles.rSectionSubtitle}>Source context and reminders are designed to stay local-first.</Text></View></View>
      <Pressable onPress={() => setPrivacyExpanded((v) => !v)} style={styles.rPrivacyCard}>
        <View style={styles.rPrivacyIcon}><ShieldCheck size={19} color={C.green} /></View><View style={{ flex: 1 }}><Text style={styles.rPrivacyTitle}>On-device by default</Text><Text style={styles.rPrivacySubtitle}>Keep the message excerpt close to the task, not in a separate cloud inbox.</Text></View><ChevronDown size={16} color={C.muted} style={privacyExpanded ? { transform: [{ rotate: '180deg' }] } : undefined} />
      </Pressable>
      {privacyExpanded ? <View style={styles.rPrivacyExpanded}><Text style={styles.rPrivacyExpandedText}>Remindly operates entirely on your device with local SQLite persistence and native alarms. No cloud relay touches your messages.</Text></View> : null}

      <View style={styles.rSettingsFooter}><Text style={styles.rSettingsFooterBrand}>Remindly</Text><View style={styles.rSettingsFooterDot} /><Text style={styles.rSettingsFooterText}>Made for follow-through.</Text></View>
    </View>
  );
}

function OnboardingScreen({
  topInset,
  bottomInset,
  onClose,
  onStart,
  onGoogleSignIn,
  onOpenSignIn,
}: {
  topInset: number;
  bottomInset: number;
  onClose: () => void;
  onStart: () => void;
  onGoogleSignIn: (user: UserProfile) => void | Promise<void>;
  onOpenSignIn?: () => void;
}) {
  const [signingIn, setSigningIn] = useState(false);

  const effectiveTopInset = Math.max(topInset, Platform.OS === 'android' ? ((StatusBar.currentHeight || 44) + 16) : 24, 56);
  const effectiveBottomInset = Math.max(bottomInset, Platform.OS === 'android' ? 56 : 24, 48);

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGooglePress = async () => {
    if (signingIn) return;
    try {
      setSigningIn(true);
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      const redirectUrl = isExpoGo
        ? AuthSession.makeRedirectUri({ path: 'oauth-native-callback' })
        : AuthSession.makeRedirectUri({ scheme: 'remindly', path: 'oauth-native-callback' });
      const result = await startOAuthFlow({ redirectUrl });
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        onClose();
      } else if (result.authSessionResult?.type !== 'cancel' && result.authSessionResult?.type !== 'dismiss') {
        Alert.alert('Sign-in incomplete', 'Google sign-in did not finish. Please try again.');
      }
    } catch (error) {
      Alert.alert('Could not sign in', 'Google sign-in failed. Please try again or continue as a guest.');
    } finally { setSigningIn(false); }
  };

  const handleGuestPress = async () => {
    try { await onGoogleSignIn({ ...DEFAULT_USER }); onClose(); }
    catch { Alert.alert('Could not continue', 'Please try again.'); }
  };

  return (
    <View style={styles.onboardingFullscreen}>
      <LinearGradient
        colors={['#E8F0E3', '#DDE7DA', '#C9D9CE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.onboardingPanelFull,
          {
            paddingTop: Platform.OS === 'web' ? 20 : effectiveTopInset,
            paddingBottom: Platform.OS === 'web' ? 24 : effectiveBottomInset,
          },
        ]}
      >
        <View style={styles.onboardingTopRow}>
          <View style={styles.onboardingBrandDot} />
          <Text style={styles.onboardingBrand}>Remindly</Text>
          <View style={{ flex: 1 }} />
          <Sun color="#D9A82F" size={22} />
          <Pressable onPress={onClose} style={styles.onboardingClose} accessibilityLabel="Close onboarding"><X color="#203725" size={19} /></Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={styles.onboardingIllustration}>
            <View style={[styles.orbit, styles.orbitOne]} /><View style={[styles.orbit, styles.orbitTwo]} />
            <View style={styles.illusMiniTag}><MessageCircle color="#14331D" size={13} /><Text style={styles.illusMiniTagText}>A message</Text></View>
            <View style={styles.illusMessageCard}>
              <View style={styles.illusMessageHeader}><View style={styles.illusAvatar}><Text style={styles.illusAvatarText}>M</Text></View><View style={{ flex: 1 }}><Text style={styles.illusSender}>Maya Patel</Text><Text style={styles.illusMessageSub}>WhatsApp · just now</Text></View><View style={styles.illusLink}><Link2 color="#173D25" size={15} /></View></View>
              <Text style={styles.illusQuote}>“Could you send the final draft by tomorrow?”</Text>
              <View style={styles.illusArrow}><ArrowRight size={18} color={C.ink} /></View>
            </View>
            <View style={styles.illusReminderCard}>
              <View style={styles.illusReminderIcon}><AlarmClock color={C.black} size={19} /></View>
              <View style={{ flex: 1 }}><Text style={styles.illusReminderLabel}>REMINDER SAVED</Text><Text style={styles.illusReminderText}>Tomorrow · 9:00 AM</Text></View><CheckCircle2 color="#203B22" size={18} />
            </View>
            <View style={styles.illusSpark}><Sparkles size={18} color="#B18B2D" /></View>
          </View>
          <View style={styles.onboardingCopy}>
            <Text style={styles.onboardingHeadline}>{'Catch it.\nSchedule it.\nGet it done.'}</Text>
            <Text style={styles.onboardingDescription}>Turn messages, chats, and links into thoughtful follow-ups—without losing where they came from.</Text>
            <View style={styles.onboardingFeatureRow}><View style={styles.onboardingFeatureIcon}><Link2 color="#183B25" size={17} /></View><View style={{ flex: 1 }}><Text style={styles.onboardingFeatureTitle}>Capture in a moment</Text><Text style={styles.onboardingFeatureText}>Share a message. Confirm the deadline. Done.</Text></View></View>
            <View style={styles.onboardingFeatureRow}><View style={styles.onboardingFeatureIcon}><Clock3 color="#183B25" size={17} /></View><View style={{ flex: 1 }}><Text style={styles.onboardingFeatureTitle}>Reminders that fit your day</Text><Text style={styles.onboardingFeatureText}>Choose a schedule and quiet hours that work for you.</Text></View></View>
            <View style={styles.onboardingFeatureRow}><View style={styles.onboardingFeatureIcon}><ShieldCheck color="#183B25" size={17} /></View><View style={{ flex: 1 }}><Text style={styles.onboardingFeatureTitle}>Your context stays close</Text><Text style={styles.onboardingFeatureText}>Keep the source excerpt and link when one is available.</Text></View></View>
          </View>
        </ScrollView>

        <View style={styles.onboardingActions}>
          <Pressable onPress={handleGooglePress} style={styles.onboardingGoogleBtn} accessibilityLabel="Continue with Google">
            {signingIn ? (
              <ActivityIndicator size="small" color="#1F1F1F" />
            ) : (
              <>
                <View style={styles.googleIconBox}>
                  <GoogleIcon size={19} />
                </View>
                <Text style={styles.onboardingGoogleText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
          {onOpenSignIn ? (
            <Pressable onPress={onOpenSignIn} style={styles.onboardingEmailBtn} accessibilityLabel="Sign in with Email or Account">
              <Text style={styles.onboardingEmailText}>Sign in with Email or Account</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={handleGuestPress} style={styles.onboardingPrimary} accessibilityLabel="Explore the app first">
            <Text style={styles.onboardingPrimaryText}>Explore the app first</Text>
            <ArrowRight size={19} color="#F8F5ED" />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function QuickCaptureSheet({
  editingTask,
  initialText,
  initialSource,
  initialSourceUrl,
  defaultProfile,
  dateOnlyTime,
  initialSubject,
  initialSender,
  initialTitle,
  initialDateMode = 'today',
  initialDaysOffset = 2,
  blurTarget,
  bottomInset,
  onClose,
  onSave,
  onError,
  onDirtyChange,
  onOpenProfileSelector,
}: {
  editingTask?: OmniTask;
  initialText: string;
  initialSource: TaskSource;
  initialSourceUrl?: string;
  defaultProfile: ProfileKey;
  dateOnlyTime: string;
  initialSubject?: string;
  initialSender?: string;
  initialTitle?: string;
  initialDateMode?: 'today' | 'tomorrow' | 'custom' | 'inbox';
  initialDaysOffset?: number;
  blurTarget: React.RefObject<any>;
  bottomInset: number;
  onClose: () => void;
  onSave: (task: OmniTask) => void | Promise<void>;
  onError: (message: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onOpenProfileSelector?: (currentProfile: ProfileKey, onSelect: (p: ProfileKey) => void) => void;
}) {
  const suggestedTitle = useMemo(() => {
    if (editingTask) return editingTask.title;
    if (initialTitle?.trim()) return initialTitle.trim();
    const normalized = initialText.trim().replace(/\s+/g, ' ');
    if (!normalized) return '';
    const firstSentence = normalized.split(/[.!?](?:\s|$)/)[0];
    return firstSentence.length > 74 ? `${firstSentence.slice(0, 71).trim()}…` : firstSentence;
  }, [initialText, initialTitle, editingTask]);

  const [title, setTitle] = useState(suggestedTitle);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!sourceOverridden) {
      const detected = detectSource(newTitle);
      if (detected !== 'Manual') {
        setSelectedSource(detected);
      }
    }
  };
  const [profile, setProfile] = useState<ProfileKey>(editingTask?.profile || defaultProfile);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showSource, setShowSource] = useState(Boolean(initialText));
  const [saving, setSaving] = useState(false);
  const sourceExcerpt = editingTask?.excerpt || initialText.trim() || '';

  useEffect(() => {
    const isDirty = Boolean(title.trim().length > 0 || initialText.trim());
    onDirtyChange?.(isDirty);
  }, [title, suggestedTitle, onDirtyChange]);

  // Structured Date selection: 'today' | 'tomorrow' | 'custom' | 'inbox'
  const [useDeadline, setUseDeadline] = useState(initialDateMode !== 'inbox');
  const [selectedDateMode, setSelectedDateMode] = useState<'today' | 'tomorrow' | 'custom' | 'inbox'>(initialDateMode);
  const [customDaysOffset, setCustomDaysOffset] = useState<number>(initialDaysOffset);
  const [isImportant, setIsImportant] = useState<boolean>(editingTask?.important ?? defaultProfile === 'Important');

  // Smart auto-detection helper for incoming or typed context
  const detectSource = (txt: string): TaskSource => {
    if (/\[\d{1,2}:\d{2}.*\]|\+?\d{10,13}|whatsapp|forwarded|chat/i.test(txt)) return 'WhatsApp';
    if (/outlook|hotmail|@live\.com|@outlook|microsoft|teams|m365/i.test(txt)) return 'Outlook';
    if (/from:|subject:|@gmail|@google|mail\.google|fwd:|re:|email/i.test(txt)) return 'Gmail';
    if (/slack\.com|#general|@channel|@here|slack/i.test(txt)) return 'Slack';
    if (/telegram|t\.me|tg:/i.test(txt)) return 'Telegram';
    if (/https?:\/\/|www\./i.test(txt)) return 'Web';
    if (/^[-*•]\s|memo|todo|note|list/i.test(txt)) return 'Notes';
    return 'Manual';
  };

  const [selectedSource, setSelectedSource] = useState<TaskSource>(() => {
    if (editingTask) return editingTask.source;
    if (initialSource && initialSource !== 'Manual') return initialSource;
    if (initialText) {
      const detected = detectSource(initialText);
      if (detected !== 'Manual') return detected;
    }
    return 'Manual';
  });
  const [sourceOverridden, setSourceOverridden] = useState(Boolean(initialSource && initialSource !== 'Manual'));

  // Initialize time dynamically to a future time (+10 min) rounded to next 5 minutes
  const getFutureInitialTime = (offsetMins = 10) => {
    const d = futureCaptureTime(new Date(), offsetMins);
    let h = d.getHours();
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { hour: h, minute: d.getMinutes(), period: p, date: d };
  };

  const defaultTime = () => {
    const match = formatTimeLabel(dateOnlyTime).match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    return { hour: match ? Number(match[1]) : 9, minute: match ? Number(match[2]) : 0, period: (match?.[3] || 'AM') as 'AM' | 'PM' };
  };
  const initialTime = useMemo(() => {
    if (editingTask?.dueAtUtc && Date.parse(editingTask.dueAtUtc) > Date.now()) {
      const date = new Date(editingTask.dueAtUtc);
      return { hour: date.getHours() % 12 || 12, minute: date.getMinutes(), period: (date.getHours() >= 12 ? 'PM' : 'AM') as 'AM' | 'PM' };
    }
    return initialDateMode === 'tomorrow' || initialDateMode === 'custom' ? defaultTime() : getFutureInitialTime(10);
  }, []);
  const [selectedHour, setSelectedHour] = useState<number>(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialTime.minute);
  const [minuteInputStr, setMinuteInputStr] = useState<string>(initialTime.minute < 10 ? `0${initialTime.minute}` : `${initialTime.minute}`);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialTime.period);
  const [showTimePicker, setShowTimePicker] = useState(true);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (initialText.trim() && !editingTask) {
      const parsed = parseCaptureText(initialText, new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone, { defaultDateOnlyTime: dateOnlyTime });
      if (parsed.kind === 'ambiguous') {
        setUseDeadline(false);
        setSelectedDateMode('inbox');
        return;
      }
      if (parsed.primaryCandidate) {
        const target = new Date(parsed.primaryCandidate.instantUtc);
        const selection = captureDateSelection(target);
        setSelectedDateMode(selection.mode);
        setCustomDaysOffset(selection.offset);
        setSelectedHour(target.getHours() % 12 || 12);
        setSelectedMinute(target.getMinutes());
        setMinuteInputStr(String(target.getMinutes()).padStart(2, '0'));
        setSelectedPeriod(target.getHours() >= 12 ? 'PM' : 'AM');
        return;
      }
    }
    if (initialDateMode === 'today') {
      const selection = captureDateSelection(futureCaptureTime());
      setSelectedDateMode(selection.mode);
      setCustomDaysOffset(selection.offset);
    }
  }, []);

  // Check if selected time is in the past for today
  const isPastTimeToday = useMemo(() => {
    if (!useDeadline || (selectedDateMode !== 'today' && !(selectedDateMode === 'custom' && customDaysOffset === 0))) return false;
    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
    else if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;
    const chosenTotalMins = h24 * 60 + selectedMinute;
    const cur = new Date();
    const currentTotalMins = cur.getHours() * 60 + cur.getMinutes();
    return chosenTotalMins <= currentTotalMins;
  }, [useDeadline, selectedDateMode, customDaysOffset, selectedHour, selectedMinute, selectedPeriod]);

  // Generate 28 upcoming days for custom date picker
  const upcomingDays = useMemo(() => {
    return Array.from({ length: Math.max(28, initialDaysOffset + 1) }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      return {
        offset: idx,
        dayNum: d.getDate(),
        dow: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        month: d.toLocaleDateString(undefined, { month: 'short' }),
        fullLabel: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });
  }, []);

  const customTargetDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + customDaysOffset);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }, [customDaysOffset]);

  // Derived formatted date & time strings
  const formattedTime = useMemo(() => {
    const minVal = Math.max(0, Math.min(59, selectedMinute));
    const minStr = minVal < 10 ? `0${minVal}` : `${minVal}`;
    return `${selectedHour}:${minStr} ${selectedPeriod}`;
  }, [selectedHour, selectedMinute, selectedPeriod]);

  const formattedDate = useMemo(() => {
    if (selectedDateMode === 'tomorrow') return 'Tomorrow';
    if (selectedDateMode === 'custom') return customTargetDay;
    if (selectedDateMode === 'inbox') return 'Inbox';
    return 'Today';
  }, [selectedDateMode, customTargetDay]);

  const formattedDeadline = useMemo(() => {
    if (!useDeadline || selectedDateMode === 'inbox') return 'No deadline';
    return `${formattedDate} · ${formattedTime}`;
  }, [useDeadline, selectedDateMode, formattedDate, formattedTime]);

  const chooseDateMode = (mode: 'today' | 'tomorrow' | 'custom' | 'inbox') => {
    if (mode === 'inbox') {
      setUseDeadline(false);
      setSelectedDateMode('inbox');
      return;
    }
    setUseDeadline(true);
    setSelectedDateMode(mode);
    if (mode === 'tomorrow' || mode === 'custom') {
      const time = defaultTime();
      setSelectedHour(time.hour);
      setSelectedMinute(time.minute);
      setMinuteInputStr(String(time.minute).padStart(2, '0'));
      setSelectedPeriod(time.period);
    } else {
      const fut = getFutureInitialTime(10);
      setSelectedHour(fut.hour);
      setSelectedMinute(fut.minute);
      setMinuteInputStr(fut.minute < 10 ? `0${fut.minute}` : `${fut.minute}`);
      setSelectedPeriod(fut.period);
      const selection = captureDateSelection(fut.date);
      setSelectedDateMode(selection.mode);
      setCustomDaysOffset(selection.offset);
    }
  };

  const applyPreset = (h: number, m: number, p: 'AM' | 'PM') => {
    setUseDeadline(true);
    setSelectedHour(h);
    setSelectedMinute(m);
    setMinuteInputStr(m < 10 ? `0${m}` : `${m}`);
    setSelectedPeriod(p);
  };

  const applyOffsetMinutes = (mins: number) => {
    setUseDeadline(true);
    const d = new Date(Date.now() + mins * 60 * 1000);
    const selection = captureDateSelection(d);
    setSelectedDateMode(selection.mode);
    setCustomDaysOffset(selection.offset);
    let h = d.getHours();
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    setSelectedHour(h);
    setSelectedMinute(d.getMinutes());
    setMinuteInputStr(d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`);
    setSelectedPeriod(p);
  };

  const applyOffsetHours = (offset: number) => {
    applyOffsetMinutes(offset * 60);
  };

  const adjustMinute = (delta: number) => {
    const target = captureDeadline(selectedDateMode, customDaysOffset, selectedHour, selectedMinute, selectedPeriod);
    if (!target) return;
    target.setMinutes(target.getMinutes() + delta);
    const selection = captureDateSelection(target);
    setSelectedDateMode(selection.mode);
    setCustomDaysOffset(selection.offset);
    setSelectedHour(target.getHours() % 12 || 12);
    setSelectedPeriod(target.getHours() >= 12 ? 'PM' : 'AM');
    setSelectedMinute(target.getMinutes());
    setMinuteInputStr(String(target.getMinutes()).padStart(2, '0'));
  };

  const handleMinuteTextChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setMinuteInputStr(clean);
    const val = parseInt(clean, 10);
    if (!isNaN(val)) {
      setSelectedMinute(Math.max(0, Math.min(59, val)));
    }
  };

  const handleSave = async () => {
    const deadline = captureDeadline(useDeadline ? selectedDateMode : 'inbox', customDaysOffset, selectedHour, selectedMinute, selectedPeriod);
    if (deadline && deadline.getTime() <= Date.now()) {
      setSaveError('Choose a future date and time.');
      onError('Choose a future date and time.');
      return;
    }
    const finalTitle = title.trim() || (suggestedTitle.trim() ? suggestedTitle : 'Quick reminder');
    if (saving) return;
    setSaving(true);
    setSaveError('');

    let dueLocalDate: string | undefined = undefined;
    let dueLocalTime: string | undefined = undefined;
    let dueAtUtc: string | undefined = undefined;

    if (useDeadline && selectedDateMode !== 'inbox') {
      const targetDate = new Date();
      if (selectedDateMode === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (selectedDateMode === 'custom') {
        targetDate.setDate(targetDate.getDate() + customDaysOffset);
      }

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      dueLocalDate = `${yyyy}-${mm}-${dd}`;

      let hours24 = selectedHour;
      if (selectedPeriod === 'PM' && hours24 < 12) hours24 += 12;
      else if (selectedPeriod === 'AM' && hours24 === 12) hours24 = 0;
      const hh = String(hours24).padStart(2, '0');
      const minVal = Math.max(0, Math.min(59, selectedMinute));
      const minStr = String(minVal).padStart(2, '0');
      dueLocalTime = `${hh}:${minStr}`;

      const scheduledLocal = new Date(yyyy, targetDate.getMonth(), targetDate.getDate(), hours24, minVal, 0);
      dueAtUtc = scheduledLocal.toISOString();
    }

    const newTask: OmniTask = {
      ...editingTask,
      id: editingTask?.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: finalTitle,
      timeLabel: useDeadline ? formattedTime : 'No deadline',
      dateLabel: useDeadline ? formattedDate : 'Inbox',
      status: useDeadline ? 'upcoming' : 'inbox',
      source: selectedSource,
      excerpt: sourceExcerpt,
      sourceUrl: initialSourceUrl || editingTask?.sourceUrl,
      sourceSubject: initialSubject || editingTask?.sourceSubject,
      sourceSender: initialSender || editingTask?.sourceSender,
      important: isImportant,
      profile: isImportant && profile === 'Simple' ? 'Important' : profile,
      createdAt: editingTask?.createdAt || Date.now(),
      completedAt: undefined,
      dueLocalDate,
      dueLocalTime,
      dueAtUtc,
      duePrecision: useDeadline ? 'datetime' : 'none',
    };
    try { await onSave(newTask); }
    catch { setSaveError('Could not save reminder. Please try again.'); onError('Could not save reminder. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboardWrap}>
      <View style={[styles.rCaptureSheet, { paddingBottom: Platform.OS === 'web' ? 24 : Math.max(bottomInset, 20) + 12 }]}>
        <BlurView blurTarget={blurTarget} intensity={Platform.OS === 'web' ? 50 : 64} tint="dark" blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={['rgba(53,44,31,0.88)', 'rgba(29,25,20,0.95)', 'rgba(22,19,15,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.rCaptureGlow} />
        <View style={styles.sheetHandle} />

        <View style={styles.rCaptureHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.rCaptureEyebrowRow}>
              <View style={styles.rCaptureBrandDot} />
              <Text style={styles.rCaptureEyebrow}>QUICK CAPTURE</Text>
              <Text style={styles.rCaptureEyebrowSub}> / MAKE IT STICK</Text>
            </View>
            <Text style={styles.rCaptureHeading}>Make it a reminder.</Text>
            <Text style={styles.rCaptureSub}>Catch the promise first. Fine-tune the details in a moment.</Text>
          </View>
          <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close capture sheet"><X color={C.ink2} size={18} /></Pressable>
        </View>

        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <View style={styles.rCaptureSectionTop}>
            <Text style={styles.rCaptureFieldLabel}>THE COMMITMENT</Text>
            <Pressable
              onPress={() => {
                onOpenProfileSelector?.(profile, (newProfile) => {
                  setProfile(newProfile);
                  setIsImportant(newProfile === 'Important');
                });
              }}
              style={styles.rCaptureProfileBadge}
              accessibilityLabel={`Profile ${profile}. Tap to change.`}
            >
              <Bell size={12} color={C.lime} />
              <Text style={styles.rCaptureProfileBadgeText}>{profile}</Text>
              <ChevronDown size={12} color={C.lime} />
            </Pressable>
          </View>
          <View style={styles.rTitleBox}>
            <TextInput
              value={title}
              onChangeText={handleTitleChange}
              placeholder={saveError || 'What do you need to remember?'}
              placeholderTextColor={C.muted2}
              multiline
              style={styles.rTitleInput}
              autoFocus={false}
            />
          </View>

          {/* Interactive Source Selector: WhatsApp, Outlook, Gmail, Slack, Telegram, Notes, Web, Manual */}
          <View style={styles.rCaptureSourceSection}>
            <View style={styles.rCaptureSourceHeaderRow}>
              <Text style={styles.rCaptureFieldLabel}>ATTACHED SOURCE CONTEXT</Text>
              {!sourceOverridden && selectedSource !== 'Manual' ? (
                <View style={styles.rDetectedBadge}>
                  <Sparkles size={10} color={C.lime} />
                  <Text style={styles.rDetectedBadgeText}>Auto-detected {selectedSource}</Text>
                </View>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rCaptureSourceScroll}>
              {(['Manual', 'WhatsApp', 'Outlook', 'Gmail', 'Slack', 'Telegram', 'Notes', 'Web', 'Other'] as TaskSource[]).map((src) => {
                const active = selectedSource === src;
                return (
                  <Pressable
                    key={src}
                    onPress={() => {
                      setSourceOverridden(true);
                      setSelectedSource(src);
                    }}
                    style={[styles.rCaptureSourceChip, active && styles.rCaptureSourceChipActive]}
                  >
                    {sourceIcon(src, 12, active ? C.black : C.ink2)}
                    <Text style={[styles.rCaptureSourceChipText, active && styles.rCaptureSourceChipTextActive]}>{src}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.rCaptureSectionTop}><Text style={styles.rCaptureFieldLabel}>WHEN SHOULD WE NUDGE YOU?</Text><Text style={styles.rCaptureSectionNote}>Strict deadline formatting.</Text></View>

          {/* Flexible Date Row: Today, Tomorrow, Custom date, Inbox (No Monday chip) */}
          <View style={styles.rDeadlineRow}>
            <Pressable onPress={() => chooseDateMode('today')} style={[styles.rDeadlinePill, selectedDateMode === 'today' && styles.rDeadlinePillActive]}>
              <Sun size={13} color={selectedDateMode === 'today' ? C.black : C.ink2} />
              <Text style={[styles.rDeadlinePillText, selectedDateMode === 'today' && styles.rDeadlinePillTextActive]}>Today</Text>
            </Pressable>
            <Pressable onPress={() => chooseDateMode('tomorrow')} style={[styles.rDeadlinePill, selectedDateMode === 'tomorrow' && styles.rDeadlinePillActive]}>
              <CalendarDays size={13} color={selectedDateMode === 'tomorrow' ? C.black : C.ink2} />
              <Text style={[styles.rDeadlinePillText, selectedDateMode === 'tomorrow' && styles.rDeadlinePillTextActive]}>Tomorrow</Text>
            </Pressable>
            <Pressable onPress={() => chooseDateMode('custom')} style={[styles.rDeadlinePill, selectedDateMode === 'custom' && styles.rDeadlinePillActive]}>
              <CalendarDays size={13} color={selectedDateMode === 'custom' ? C.black : C.ink2} />
              <Text style={[styles.rDeadlinePillText, selectedDateMode === 'custom' && styles.rDeadlinePillTextActive]}>Custom</Text>
            </Pressable>
            <Pressable onPress={() => chooseDateMode('inbox')} style={[styles.rDeadlinePill, selectedDateMode === 'inbox' && styles.rDeadlinePillActive]}>
              <Inbox size={13} color={selectedDateMode === 'inbox' ? C.black : C.ink2} />
              <Text style={[styles.rDeadlinePillText, selectedDateMode === 'inbox' && styles.rDeadlinePillTextActive]}>Inbox</Text>
            </Pressable>
          </View>

          {/* Interactive Date Strip when Custom mode is selected */}
          {selectedDateMode === 'custom' ? (
            <View style={styles.customDateStripWrap}>
              <Text style={styles.customDateStripLabel}>CHOOSE DATE FROM TIMELINE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.customDaysList}>
                {upcomingDays.map((item) => {
                  const active = customDaysOffset === item.offset;
                  return (
                    <Pressable
                      key={item.offset}
                      onPress={() => setCustomDaysOffset(item.offset)}
                      style={[styles.customDayChip, active && styles.customDayChipActive]}
                    >
                      <Text style={[styles.customDayDow, active && styles.customDayDowActive]}>{item.dow}</Text>
                      <Text style={[styles.customDayNum, active && styles.customDayNumActive]}>{item.dayNum}</Text>
                      <Text style={[styles.customDayMonth, active && styles.customDayMonthActive]}>{item.month}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {useDeadline ? (
            <View>
              {/* Tactile Time Bar */}
              <Pressable style={styles.tactileTimeBar} onPress={() => setShowTimePicker((v) => !v)}>
                <View style={styles.tactileClockIcon}><Clock3 size={18} color={C.lime} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tactileTimeLabel}>DATE & TIME (TACTILE SELECTOR)</Text>
                  <Text style={styles.tactileTimeValue}>{formattedDeadline}</Text>
                  <Text style={styles.tactileTimeHint}>Nudge at {formattedTime} on {formattedDate}</Text>
                </View>
                <View style={styles.tactileChangePill}>
                  <Text style={styles.tactileChangeText}>{showTimePicker ? 'Done' : 'Change'}</Text>
                  <ChevronDown size={14} color={C.lime} style={showTimePicker ? { transform: [{ rotate: '180deg' }] } : undefined} />
                </View>
              </Pressable>

              {/* Quick Preset Buttons */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rPresetScroll}>
                <Pressable onPress={() => applyOffsetMinutes(1)} style={[styles.rPresetBtn, { borderColor: 'rgba(224,243,74,0.3)' }]}><Text style={[styles.rPresetText, { color: C.lime }]}>⚡ +1m (Test)</Text></Pressable>
                <Pressable onPress={() => applyOffsetMinutes(5)} style={styles.rPresetBtn}><Text style={styles.rPresetText}>⏱️ +5m</Text></Pressable>
                <Pressable onPress={() => applyOffsetMinutes(15)} style={styles.rPresetBtn}><Text style={styles.rPresetText}>⏰ +15m</Text></Pressable>
                <Pressable onPress={() => applyOffsetHours(1)} style={styles.rPresetBtn}><Text style={styles.rPresetText}>🕒 +1h</Text></Pressable>
                <Pressable onPress={() => applyPreset(9, 0, 'AM')} style={styles.rPresetBtn}><Text style={styles.rPresetText}>🌅 9 AM</Text></Pressable>
                <Pressable onPress={() => applyPreset(2, 0, 'PM')} style={styles.rPresetBtn}><Text style={styles.rPresetText}>☀️ 2 PM</Text></Pressable>
                <Pressable onPress={() => applyPreset(6, 0, 'PM')} style={styles.rPresetBtn}><Text style={styles.rPresetText}>🌆 6 PM</Text></Pressable>
                <Pressable onPress={() => applyPreset(8, 30, 'PM')} style={styles.rPresetBtn}><Text style={styles.rPresetText}>🌙 8:30 PM</Text></Pressable>
              </ScrollView>
              {isPastTimeToday && (
                <Text style={styles.rPastTimeWarning}>⚠️ This time has already passed today. Please pick a future time.</Text>
              )}

              {/* Tactile Time Picker (Strict AM/PM, Hour grid, Flexible Minute Stepper + Chips) */}
              {showTimePicker ? (
                <View style={styles.tactilePickerContainer}>
                  {/* AM/PM Switch */}
                  <View style={styles.rPeriodRow}>
                    <Text style={styles.rPickerLabel}>PERIOD</Text>
                    <View style={styles.rAmPmSwitch}>
                      <Pressable onPress={() => setSelectedPeriod('AM')} style={[styles.rAmPmBtn, selectedPeriod === 'AM' && styles.rAmPmBtnActive]}>
                        <Text style={[styles.rAmPmBtnText, selectedPeriod === 'AM' && styles.rAmPmBtnTextActive]}>AM</Text>
                      </Pressable>
                      <Pressable onPress={() => setSelectedPeriod('PM')} style={[styles.rAmPmBtn, selectedPeriod === 'PM' && styles.rAmPmBtnActive]}>
                        <Text style={[styles.rAmPmBtnText, selectedPeriod === 'PM' && styles.rAmPmBtnTextActive]}>PM</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Hour Buttons (1-12) */}
                  <Text style={styles.rPickerLabel}>HOUR</Text>
                  <View style={styles.rHourGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                      const active = selectedHour === h;
                      return (
                        <Pressable key={h} onPress={() => setSelectedHour(h)} style={[styles.rHourBtn, active && styles.rHourBtnActive]}>
                          <Text style={[styles.rHourBtnText, active && styles.rHourBtnTextActive]}>{h}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Flexible Minute Controls: Stepper, Custom Number Input, and 5-min Chips */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={styles.rPickerLabel}>MINUTE (FLEXIBLE / CUSTOM)</Text>
                    <Text style={styles.rMinuteLive}>{selectedMinute < 10 ? `:0${selectedMinute}` : `:${selectedMinute}`}</Text>
                  </View>

                  {/* Minute Stepper Row */}
                  <View style={styles.minuteStepperRow}>
                    <Pressable onPress={() => adjustMinute(-5)} style={styles.minuteStepBtn}><Text style={styles.minuteStepBtnText}>-5m</Text></Pressable>
                    <Pressable onPress={() => adjustMinute(-1)} style={styles.minuteStepBtn}><Text style={styles.minuteStepBtnText}>-1m</Text></Pressable>
                    <View style={styles.minuteInputBox}>
                      <TextInput
                        value={minuteInputStr}
                        onChangeText={handleMinuteTextChange}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={styles.minuteTextInput}
                        selectTextOnFocus
                      />
                    </View>
                    <Pressable onPress={() => adjustMinute(1)} style={styles.minuteStepBtn}><Text style={styles.minuteStepBtnText}>+1m</Text></Pressable>
                    <Pressable onPress={() => adjustMinute(5)} style={styles.minuteStepBtn}><Text style={styles.minuteStepBtnText}>+5m</Text></Pressable>
                  </View>

                  {/* 5-minute interval quick chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.minuteChipsScroll}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                      const active = selectedMinute === m;
                      const label = m < 10 ? `:0${m}` : `:${m}`;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => {
                            setSelectedMinute(m);
                            setMinuteInputStr(m < 10 ? `0${m}` : `${m}`);
                          }}
                          style={[styles.minuteChip, active && styles.minuteChipActive]}
                        >
                          <Text style={[styles.minuteChipText, active && styles.minuteChipTextActive]}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={styles.rCaptureHelper}>Review the suggested date and time before saving. No ambiguous deadline is assumed to be confirmed.</Text>
            </View>
          ) : (
            <View style={styles.rInboxModeNote}><Inbox size={15} color={C.lime} /><Text style={styles.rInboxModeText}>Saved to Inbox until you confirm a date.</Text></View>
          )}

          {/* Priority / Important Section */}
          <View style={styles.rCaptureSectionTop}>
            <Text style={styles.rCaptureFieldLabel}>PRIORITY</Text>
            <Text style={styles.rCaptureSectionNote}>MARK IMPORTANT COMMITMENTS</Text>
          </View>
          <Pressable
            onPress={() => setIsImportant((v) => !v)}
            style={[styles.importantToggleCard, isImportant && styles.importantToggleCardActive]}
            accessibilityRole="switch"
            accessibilityState={{ checked: isImportant }}
            accessibilityLabel="Mark reminder as important"
          >
            <View style={[styles.importantIconBox, isImportant && styles.importantIconBoxActive]}>
              <Flame size={18} color={isImportant ? '#FF6B4A' : C.muted} />
            </View>
            <View style={{ flex: 1, marginLeft: 11, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.importantToggleTitle, isImportant && styles.importantToggleTitleActive]}>
                  Mark as Important
                </Text>
                {isImportant ? (
                  <View style={styles.importantBadge}>
                    <Text style={styles.importantBadgeText}>HIGH PRIORITY</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.importantToggleSub}>
                {isImportant
                  ? 'Highlighted in timeline with flame badge and prioritized alerts'
                  : 'Standard priority in your timeline'}
              </Text>
            </View>
            <Switch
              value={isImportant}
              onValueChange={setIsImportant}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#FF6B4A' }}
              thumbColor={isImportant ? '#FFFFFF' : '#888888'}
            />
          </Pressable>

          <View style={styles.rCaptureSectionTop}><Text style={styles.rCaptureFieldLabel}>REMINDER STYLE</Text><Text style={styles.rCaptureSectionNote}>How often we should nudge.</Text></View>
          <Pressable style={styles.rProfileSelector} onPress={() => setShowProfiles((v) => !v)}>
            <View style={styles.rProfileSelectorIcon}><Bell size={17} color={C.lime} /></View><View style={{ flex: 1 }}><Text style={styles.rProfileSelectorOverline}>SELECTED PROFILE</Text><Text style={styles.rProfileSelectorTitle}>{profile}</Text><Text style={styles.rProfileSelectorSummary}>{PROFILE_DESCRIPTIONS[profile]}</Text></View><View style={styles.rProfileSelectorChange}><Text style={styles.rProfileSelectorChangeText}>{showProfiles ? 'Done' : 'Change'}</Text><ChevronDown size={14} color={C.lime} style={showProfiles ? { transform: [{ rotate: '180deg' }] } : undefined} /></View>
          </Pressable>
          {showProfiles ? (
            <View style={styles.rCaptureProfileGrid}>
              {(['Simple', 'Standard', 'Important', 'Persistent'] as ProfileKey[]).map((option) => {
                const chosen = profile === option;
                return (
                  <Pressable key={option} onPress={() => { setProfile(option); if (option === 'Important') { setIsImportant(true); } setShowProfiles(false); }} style={[styles.rCaptureProfileChoice, chosen && styles.rCaptureProfileChoiceSelected]}>
                    <View style={{ flex: 1 }}><Text style={[styles.rCaptureProfileName, chosen && { color: C.lime }]}>{option}</Text><Text style={styles.rCaptureProfileDescription}>{PROFILE_DESCRIPTIONS[option]}</Text></View>
                    {chosen ? <Check size={16} color={C.lime} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {!initialText.trim() ? (
            <Pressable style={styles.rSourceDisclosure} onPress={() => setShowSource((v) => !v)}><View style={styles.rSourceDisclosureIcon}>{sourceIcon(initialSource, 14, C.muted)}</View><View style={{ flex: 1 }}><Text style={styles.rSourceDisclosureTitle}>SOURCE CONTEXT</Text><Text style={styles.rSourceDisclosureText}>No source message attached</Text></View><Text style={styles.rSourceDisclosureAction}>{showSource ? 'Hide' : 'Preview'}</Text><ChevronDown size={14} color={C.muted} style={showSource ? { transform: [{ rotate: '180deg' }] } : undefined} /></Pressable>
          ) : null}
          {showSource && !initialText.trim() ? (
            <View style={styles.rSourcePreview}><Text style={styles.rSourcePreviewQuote}>{sourceExcerpt}</Text><Text style={styles.rSourceNoLink}>A direct link may not be provided by the source app.</Text></View>
          ) : null}
        </ScrollView>

        <View style={styles.rCaptureButtonRow}>
          <Pressable onPress={onClose} style={styles.rCaptureCancel}><Text style={styles.captureCancelText}>Cancel</Text></Pressable>
          <Pressable disabled={saving || isPastTimeToday} onPress={isPastTimeToday ? undefined : handleSave} style={[styles.rCaptureSave, (saving || isPastTimeToday) && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color={C.black} size="small" /> : <CheckCircle2 size={18} color={C.black} />}
            <Text style={styles.rCaptureSaveText}>{isPastTimeToday ? 'Pick future time' : saving ? 'Saving…' : useDeadline ? 'Save reminder' : 'Save to inbox'}</Text>
            {!saving && !isPastTimeToday ? <ArrowRight color={C.black} size={17} /> : null}
          </Pressable>
        </View>
        <View style={styles.rCapturePrivacy}><ShieldCheck size={12} color={C.muted} /><Text style={styles.rCapturePrivacyText}>Saved on-device in the local-first version of Remindly.</Text></View>
      </View>
    </KeyboardAvoidingView>
  );
}


function SignInSheet({
  blurTarget,
  bottomInset,
  onClose,
  onSignIn,
}: {
  blurTarget: React.RefObject<any>;
  bottomInset: number;
  onClose: () => void;
  onSignIn: (user: UserProfile) => void | Promise<void>;
}) {
  const [signingIn, setSigningIn] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleOAuth = async () => {
    if (signingIn) return;
    try {
      setSigningIn(true);
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      const redirectUrl = isExpoGo
        ? AuthSession.makeRedirectUri({ path: 'oauth-native-callback' })
        : AuthSession.makeRedirectUri({ scheme: 'remindly', path: 'oauth-native-callback' });
      const result = await startOAuthFlow({ redirectUrl });
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        onClose();
      } else if (result.authSessionResult?.type !== 'cancel' && result.authSessionResult?.type !== 'dismiss') {
        Alert.alert('Sign-in incomplete', 'Google sign-in did not finish. Please try again.');
      }
    } catch (error) {
      Alert.alert('Could not sign in', 'Google sign-in failed. Please try again or continue as a guest.');
    } finally { setSigningIn(false); }
  };

  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [emailStep, setEmailStep] = useState<'email' | 'signInCode' | 'signUpCode'>('email');
  const [code, setCode] = useState('');

  const handleManualSignIn = async () => {
    if (signingIn || !signInLoaded || !signUpLoaded) return;
    setSigningIn(true);
    try {
      if (emailStep !== 'email') {
        const result = emailStep === 'signInCode'
          ? await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() })
          : await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (result.status !== 'complete' || !result.createdSessionId) {
          Alert.alert('Additional verification required', 'This account requires more verification. Please continue with Google or review your Clerk sign-in settings.');
          return;
        }
        await setActive({ session: result.createdSessionId });
        onClose();
        return;
      }
      const email = emailInput.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Alert.alert('Enter your email', 'Please enter a valid email address.');
        return;
      }
      try {
        const attempt = await signIn.create({ identifier: email });
        const factor = attempt.supportedFirstFactors?.find((item) => item.strategy === 'email_code');
        if (!factor || factor.strategy !== 'email_code') {
          Alert.alert('Email codes unavailable', 'Email code sign-in must be enabled in Clerk. You can also continue with Google.');
          return;
        }
        await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
        setEmailStep('signInCode');
      } catch (error: any) {
        if (!error.errors?.some((item: any) => item.code === 'form_identifier_not_found')) throw error;
        const names = nameInput.trim().split(/\s+/).filter(Boolean);
        await signUp.create({ emailAddress: email, ...(names.length ? { firstName: names[0], lastName: names.slice(1).join(' ') || undefined } : {}) });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setEmailStep('signUpCode');
      }
      Alert.alert('Check your email', 'Enter the verification code sent to ' + email + '.');
    } catch (error: any) {
      Alert.alert('Could not sign in', error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Please try again.');
    } finally { setSigningIn(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboardWrap}>
      <View style={[styles.rDetailsSheet, { paddingBottom: Platform.OS === 'web' ? 24 : bottomInset + 20 }]}>
        <BlurView blurTarget={blurTarget} intensity={Platform.OS === 'web' ? 50 : 64} tint="dark" blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={['rgba(53,44,31,0.92)', 'rgba(29,25,20,0.96)', 'rgba(22,19,15,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetEyebrow}>ACCOUNT & SYNC</Text>
            <Text style={styles.detailsTitle}>Sign in to Remindly</Text>
            <Text style={[styles.accountActionSub, { marginTop: 2 }]}>Keep your reminders and sync across devices.</Text>
          </View>
          <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close sign in">
            <X size={18} color={C.ink2} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Primary: Google Sign In */}
          <Pressable onPress={handleGoogleOAuth} style={styles.signInGoogleBtn} accessibilityLabel="Continue with Google">
            {signingIn ? (
              <ActivityIndicator size="small" color="#1F1F1F" />
            ) : (
              <>
                <View style={styles.googleIconBox}><GoogleIcon size={19} /></View>
                <Text style={styles.signInGoogleText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.signInDividerRow}>
            <View style={styles.signInDividerLine} />
            <Text style={styles.signInDividerText}>OR SIGN IN WITH YOUR DETAILS</Text>
            <View style={styles.signInDividerLine} />
          </View>

          {/* Interactive Name Field */}
          <View style={styles.signInInputGroup}>
            <Text style={styles.signInInputLabel}>YOUR NAME</Text>
            <View style={styles.signInInputBox}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="e.g. Maya Patel"
                placeholderTextColor="rgba(248,245,237,0.4)"
                style={styles.signInTextInput}
              />
            </View>
          </View>

          {/* Interactive Email Field */}
          <View style={styles.signInInputGroup}>
            <Text style={styles.signInInputLabel}>{emailStep === 'email' ? 'EMAIL ADDRESS' : 'VERIFICATION CODE'}</Text>
            <View style={styles.signInInputBox}>
              <TextInput
                value={emailStep === 'email' ? emailInput : code}
                onChangeText={emailStep === 'email' ? setEmailInput : setCode}
                placeholder={emailStep === 'email' ? 'e.g. maya@example.com' : 'Enter your email code'}
                placeholderTextColor="rgba(248,245,237,0.4)"
                keyboardType={emailStep === 'email' ? 'email-address' : 'number-pad'}
                autoCapitalize="none"
                style={styles.signInTextInput}
              />
            </View>
          </View>

          {/* Direct Sign-In Button */}
          <Pressable disabled={signingIn} onPress={handleManualSignIn} style={styles.signInDirectBtn} accessibilityLabel="Sign In and Keep Reminders">
            <ShieldCheck size={18} color="#182312" />
            <Text style={styles.signInDirectBtnText}>{signingIn ? 'Please wait?' : emailStep === 'email' ? 'Sign In & Keep Reminders' : 'Verify email'}</Text>
            <ArrowRight size={17} color="#182312" />
          </Pressable>

          <Pressable
            onPress={async () => {
              try { await onSignIn({ ...DEFAULT_USER }); onClose(); }
              catch { Alert.alert('Could not continue', 'Please try again.'); }
            }}
            style={styles.signInQuickTestBtn}
            accessibilityLabel="Continue as guest"
          >
            <View style={styles.signInQuickTestIcon}><Sparkles size={14} color={C.lime} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.signInQuickTestTitle}>Continue as guest</Text>
              <Text style={styles.signInQuickTestSub}>Keep reminders on this device</Text>
            </View>
            <ArrowRight size={15} color={C.lime} />
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function AccountProfileSheet({
  user,
  blurTarget,
  bottomInset,
  onClose,
  onLogout,
  onConnectGoogle,
}: {
  user?: UserProfile;
  blurTarget: React.RefObject<any>;
  bottomInset: number;
  onClose: () => void;
  onLogout: () => void;
  onConnectGoogle?: () => void;
}) {
  return (
    <View style={[styles.rDetailsSheet, { paddingBottom: Platform.OS === 'web' ? 24 : bottomInset + 20 }]}>
      <BlurView blurTarget={blurTarget} intensity={Platform.OS === 'web' ? 50 : 64} tint="dark" blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'} style={StyleSheet.absoluteFill} />
      <LinearGradient pointerEvents="none" colors={['rgba(53,44,31,0.88)', 'rgba(29,25,20,0.94)', 'rgba(22,19,15,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetEyebrow}>ACCOUNT & PROFILE</Text>
          <Text style={styles.detailsTitle}>Remindly Profile</Text>
        </View>
        <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close account sheet">
          <X size={18} color={C.ink2} />
        </Pressable>
      </View>

      <View style={styles.accountCard}>
        <View style={styles.accountAvatarBig}>
          <Text style={styles.accountAvatarLetter}>{user?.avatarInitial || 'A'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>{user?.name || 'Local User'}</Text>
          <Text style={styles.accountEmail}>{user?.email || 'local@device'}</Text>
          <View style={styles.accountBadge}>
            <ShieldCheck size={12} color={C.lime} />
            <Text style={styles.accountBadgeText}>{user?.authProvider === 'google' ? 'Google Account Connected' : user?.isLoggedIn ? 'Email Account Connected' : 'Local-first Guest Mode'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.accountActionsList}>
        <Pressable
          onPress={onConnectGoogle}
          style={styles.accountActionItem}
        >
          <View style={[styles.accountActionIcon, { backgroundColor: '#FFFFFF' }]}>
            <GoogleIcon size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountActionTitle}>{user?.isLoggedIn ? 'Switch Account / Connect Google' : 'Sign In with Google or Email'}</Text>
            <Text style={styles.accountActionSub}>Keep reminders under your account on this device.</Text>
          </View>
          <ArrowRight size={16} color={C.lime} />
        </Pressable>
        {user?.isLoggedIn && (
          <Pressable onPress={onLogout} style={[styles.accountActionItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.accountActionIcon, { backgroundColor: 'rgba(255,137,118,0.12)' }]}><X size={16} color={C.red} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountActionTitle, { color: C.red }]}>Sign out of Remindly</Text>
              <Text style={styles.accountActionSub}>Switch to guest mode. Your reminders remain accessible.</Text>
            </View>
            <ArrowRight size={16} color={C.red} />
          </Pressable>
        )}
      </View>
    </View>
  );
}


function ReminderAlertCard({ task, onClose, onDone, onSnooze, onDetails }: {
  task: OmniTask; onClose: () => void; onDone: () => void; onSnooze: () => void; onDetails: () => void;
}) {
  return (
    <View style={styles.alertCardWrap}>
      <View style={styles.alertCard}>
        <LinearGradient colors={['rgba(59,51,39,0.98)', 'rgba(32,29,24,0.98)']} style={styles.alertCardGradient}>
          <View style={styles.alertTopLine}><View style={styles.alertBrandIcon}><Bell size={17} color={C.black} /></View><View style={{ flex: 1 }}><Text style={styles.alertOverline}>REMINDLY · ACTION NEEDED</Text><Text style={styles.alertTime}>{task.status === 'overdue' ? 'Past your planned time' : task.timeLabel}</Text></View><Pressable onPress={onClose} style={styles.alertClose}><X color={C.muted} size={17} /></Pressable></View>
          <Pressable onPress={onDetails} style={styles.alertContent}><Text style={styles.alertTaskTitle}>{task.title}</Text><Text style={styles.alertExcerpt} numberOfLines={2}>{task.excerpt}</Text><View style={styles.alertMetaRow}><View style={styles.alertMetaPill}><Clock3 size={13} color={C.lime} /><Text style={styles.alertMetaText}>{task.dateLabel} · {task.timeLabel}</Text></View><View style={styles.alertMetaPill}>{sourceIcon(task.source, 12, C.ink2)}<Text style={styles.alertMetaText}>{task.source}</Text></View></View></Pressable>
          <View style={styles.alertActions}><Pressable onPress={onDone} style={styles.alertDone}><Check size={18} color={C.black} /><Text style={styles.alertDoneText}>Done</Text></Pressable><Pressable onPress={onSnooze} style={styles.alertSnooze}><Clock3 size={17} color={C.ink} /><Text style={styles.alertSnoozeText}>Remind me in 15m</Text></Pressable></View>
          <Pressable onPress={onDetails} style={styles.alertDetailsLink}><Text style={styles.alertDetailsText}>View reminder details</Text><ArrowRight size={13} color={C.muted} /></Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

function TaskDetailsSheet({
  task,
  bottomInset,
  blurTarget,
  isEditing = false,
  onToggleEdit,
  onClose,
  onDone,
  onSnooze,
  onDelete,
  onSaveEdit,
  onReschedule,
  onOpenSource,
  onOpenProfileSelector,
}: {
  task: OmniTask;
  bottomInset: number;
  blurTarget: React.RefObject<any>;
  isEditing?: boolean;
  onToggleEdit?: (editing: boolean) => void;
  onClose: () => void;
  onDone: () => void;
  onSnooze: (minutes: number) => void;
  onDelete?: () => void;
  onSaveEdit?: (updatedTask: OmniTask) => void;
  onReschedule: () => void;
  onOpenSource: () => void;
  onOpenProfileSelector?: (currentProfile: ProfileKey, onSelect: (p: ProfileKey) => void) => void;
}) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editProfile, setEditProfile] = useState<ProfileKey>(task.profile);
  const [editImportant, setEditImportant] = useState(Boolean(task.important));

  useEffect(() => {
    setEditTitle(task.title);
    setEditProfile(task.profile);
    setEditImportant(Boolean(task.important));
  }, [task]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    const updated: OmniTask = {
      ...task,
      title: editTitle.trim(),
      profile: editImportant && editProfile === 'Simple' ? 'Important' : editProfile,
      important: editImportant,
    };
    onSaveEdit?.(updated);
  };

  return (
    <View style={styles.sheetKeyboardWrap}>
      <View style={[styles.rDetailsSheet, { paddingBottom: Math.max(bottomInset, 20) + 12 }]}>
        <BlurView
          blurTarget={blurTarget}
          intensity={Platform.OS === 'web' ? 48 : 62}
          tint="dark"
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient pointerEvents="none" colors={['rgba(53,44,31,0.76)', 'rgba(29,25,20,0.86)']} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.rDetailsGlow} />
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetEyebrow}>{isEditing ? 'EDITING REMINDER' : 'REMINDER DETAILS'}</Text>
            {isEditing ? (
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={styles.detailsEditInput}
                placeholder="Reminder title..."
                placeholderTextColor={C.muted}
                multiline
              />
            ) : (
              <Text style={styles.detailsTitle}>{task.title}</Text>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close details sheet">
            <X color={C.ink2} size={18} />
          </Pressable>
        </View>

        {isEditing ? (
          <View style={{ marginTop: 8 }}>
            <View style={styles.detailsSectionRow}>
              <Text style={styles.sheetEyebrow}>RHYTHM PROFILE</Text>
              <Pressable
                onPress={() => {
                  onOpenProfileSelector?.(editProfile, (p) => {
                    setEditProfile(p);
                    setEditImportant(p === 'Important');
                  });
                }}
                style={styles.rCaptureProfileBadge}
              >
                <Bell size={12} color={C.lime} />
                <Text style={styles.rCaptureProfileBadgeText}>{editProfile}</Text>
                <ChevronDown size={12} color={C.lime} />
              </Pressable>
            </View>

            <View style={[styles.detailsSectionRow, { marginTop: 14 }]}>
              <Text style={styles.sheetEyebrow}>URGENCY</Text>
              <Pressable
                onPress={() => setEditImportant((prev) => !prev)}
                style={[styles.floatingNoteImportant, !editImportant && { opacity: 0.5 }]}
              >
                <Flame size={12} color="#FF6B4A" />
                <Text style={[styles.floatingNoteImportantText, { color: '#FF6B4A' }]}>
                  {editImportant ? 'IMPORTANT' : 'NORMAL'}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.detailActions, { marginTop: 24 }]}>
              <Pressable onPress={() => onToggleEdit?.(false)} style={styles.detailsCancelBtn}>
                <Text style={styles.detailsCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.detailsSaveBtn}>
                <Check size={16} color={C.black} strokeWidth={2.5} />
                <Text style={styles.detailsSaveBtnText}>Save changes</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.detailsStatusRow}>
              <View style={[styles.statusDot, task.status === 'overdue' && { backgroundColor: C.red }]} />
              <Text style={styles.detailsStatusText}>
                {task.status === 'overdue' ? 'Overdue · needs attention' : task.status === 'done' ? 'Completed' : task.status === 'inbox' ? 'Inbox · no deadline' : 'Scheduled'}
              </Text>
              <View style={{ flex: 1 }} />
              {task.important ? (
                <View style={[styles.floatingNoteImportant, { marginRight: 8 }]}>
                  <Flame size={12} color="#FF6B4A" />
                  <Text style={[styles.floatingNoteImportantText, { color: '#FF6B4A' }]}>IMPORTANT</Text>
                </View>
              ) : null}
              <View style={styles.detailProfileChip}>
                <Bell color={C.lime} size={12} />
                <Text style={styles.detailProfileText}>{task.profile}</Text>
              </View>
            </View>

            <View style={styles.detailInfoGrid}>
              <Pressable style={styles.detailInfoCard} onPress={onReschedule} accessibilityLabel="Change reminder date">
                <CalendarDays color={C.lime} size={18} />
                <Text style={styles.detailInfoLabel}>DATE</Text>
                <Text style={styles.detailInfoValue}>{task.dateLabel}</Text>
              </Pressable>
              <Pressable style={styles.detailInfoCard} onPress={onReschedule} accessibilityLabel="Change reminder time">
                <Clock3 color={C.lime} size={18} />
                <Text style={styles.detailInfoLabel}>TIME</Text>
                <Text style={styles.detailInfoValue}>{task.timeLabel}</Text>
              </Pressable>
            </View>

            <SectionLabel title="Original context" detail={`Shared from ${task.source}`} />
            <View style={styles.detailExcerptBox}>
              <View style={styles.detailExcerptHeader}>
                {sourceIcon(task.source, 15, C.lime)}
                <Text style={styles.sourceLabel}>{task.source.toUpperCase()}</Text>
                <View style={{ flex: 1 }} />
                {task.sourceUrl ? <ExternalLink size={14} color={C.muted} /> : null}
              </View>
              <Text style={styles.detailExcerptText}>{task.excerpt}</Text>
              <Pressable onPress={onOpenSource} style={styles.openSourceButton}>
                <ExternalLink size={14} color={C.lime} />
                <Text style={styles.openSourceButtonText}>
                  {task.sourceUrl ? 'Open original source' : 'Find original message'}
                </Text>
              </Pressable>
            </View>

            <SectionLabel title="Quick actions" detail="Choose the next useful step" />
            <View style={styles.detailActions}>
              <Pressable onPress={onDone} style={styles.captureSave}>
                <CheckCircle2 color={C.black} size={18} />
                <Text style={styles.captureSaveText}>Mark done</Text>
              </Pressable>
              <Pressable onPress={() => onSnooze(15)} style={styles.detailSnooze}>
                <Clock3 color={C.ink} size={17} />
                <Text style={styles.detailSnoozeText}>Snooze 15m</Text>
              </Pressable>
            </View>

            <View style={styles.snoozeChips}>
              <Pressable onPress={() => onSnooze(60)} style={styles.snoozeChip}>
                <Text style={styles.snoozeChipText}>+1 hour</Text>
              </Pressable>
              <Pressable onPress={() => onSnooze(240)} style={styles.snoozeChip}>
                <Text style={styles.snoozeChipText}>Later today</Text>
              </Pressable>
              <Pressable onPress={() => onSnooze(1440)} style={styles.snoozeChip}>
                <Text style={styles.snoozeChipText}>Tomorrow</Text>
              </Pressable>
            </View>

            {/* Management Actions: Edit and Delete */}
            <View style={styles.detailsManagementRow}>
              <Pressable
                onPress={() => onToggleEdit?.(true)}
                style={styles.detailsEditButton}
                accessibilityLabel="Edit reminder"
              >
                <Pencil size={14} color={C.lime} />
                <Text style={styles.detailsEditButtonText}>Edit reminder</Text>
              </Pressable>

              <Pressable
                onPress={onDelete}
                style={styles.detailsDeleteButton}
                accessibilityLabel="Delete reminder"
              >
                <Trash2 size={14} color={C.red} />
                <Text style={styles.detailsDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function BottomNav({ tab, onTab, onAdd, blurTarget, bottomInset = 20 }: { tab: TabKey; onTab: (value: TabKey) => void; onAdd: () => void; blurTarget: React.RefObject<any>; bottomInset?: number }) {
  const navItems: { key: TabKey; label: string; icon: any }[] = [
    { key: 'today', label: 'Today', icon: Clock3 },
    { key: 'calendar', label: 'Calendar', icon: CalendarDays },
    { key: 'inbox', label: 'Inbox', icon: Inbox },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <View style={[styles.bottomNavOuter, { paddingBottom: Platform.OS === 'web' ? 14 : Math.max(bottomInset, 42) + 6 }]}>
      <BlurView blurTarget={blurTarget} intensity={Platform.OS === 'web' ? 42 : 50} tint="dark" blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'} style={styles.bottomNavBlur} />
      <View style={styles.bottomNavGloss} pointerEvents="none" />
      <View style={styles.bottomNav}>
        {navItems.slice(0, 2).map((item) => <NavButton key={item.key} item={item} active={tab === item.key} onPress={() => onTab(item.key)} />)}
        <Pressable onPress={onAdd} style={({ pressed }) => [styles.navAdd, pressed && { transform: [{ scale: 0.95 }] }]} accessibilityLabel="Quick capture reminder"><Plus size={26} color={C.black} strokeWidth={2.5} /></Pressable>
        {navItems.slice(2).map((item) => <NavButton key={item.key} item={item} active={tab === item.key} onPress={() => onTab(item.key)} />)}
      </View>
    </View>
  );
}

function NavButton({ item, active, onPress }: { item: { key: TabKey; label: string; icon: any }; active: boolean; onPress: () => void }) {
  const Icon = item.icon;
  return <Pressable onPress={onPress} style={styles.navButton} accessibilityRole="button" accessibilityLabel={item.label}><View style={[styles.navIconWrap, active && styles.navIconWrapActive]}><Icon size={19} color={active ? C.lime : C.muted} strokeWidth={active ? 2.1 : 1.7} /></View><Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text></Pressable>;
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text></Pressable>;
}

function SectionLabel({ title, detail }: { title: string; detail?: string }) {
  return <View style={styles.sectionLabelWrap}><Text style={styles.sectionLabelTitle}>{title}</Text>{detail ? <Text style={styles.sectionLabelDetail}>{detail}</Text> : null}</View>;
}

function EmptyState({ title, subtitle, onAdd }: { title: string; subtitle: string; onAdd?: () => void }) {
  return <View style={styles.emptyState}><View style={styles.emptyStateIcon}><Sparkles size={23} color={C.lime} /></View><Text style={styles.emptyStateTitle}>{title}</Text><Text style={styles.emptyStateText}>{subtitle}</Text>{onAdd ? <Pressable onPress={onAdd} style={styles.emptyStateButton}><Plus color={C.black} size={16} /><Text style={styles.emptyStateButtonText}>Capture reminder</Text></Pressable> : null}</View>;
}

function sourceIcon(source: TaskSource, size = 16, color = C.ink2) {
  if (source === 'WhatsApp') return <MessageCircle size={size} color={color} />;
  if (source === 'Outlook') return <Mail size={size} color={color} />;
  if (source === 'Gmail') return <FileText size={size} color={color} />;
  if (source === 'Slack') return <MoreHorizontal size={size} color={color} />;
  if (source === 'Telegram') return <Send size={size} color={color} />;
  if (source === 'Web') return <Globe size={size} color={color} />;
  if (source === 'Other') return <Layers size={size} color={color} />;
  if (source === 'Notes') return <FileText size={size} color={color} />;
  return <CalendarDays size={size} color={color} />;
}

// ----------------------------------------------------------------------------
// Styles - warm, dimensional, restrained glass with diffuse SVG backdrop.
// ----------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas, minHeight: 0 },
  targetRoot: { flex: 1, minHeight: 0 },
  rootGradient: { flex: 1, minHeight: 0, overflow: 'hidden' },
  ambientSvg: { ...StyleSheet.absoluteFill, opacity: 1 },
  backdropVeil: { ...StyleSheet.absoluteFill },
  appFrame: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', minHeight: 0 },
  appFrameWide: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.045)' },
  contentViewport: { flex: 1, minHeight: 0 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 40 },
  header: { paddingHorizontal: 21, paddingTop: Platform.OS === 'web' ? 18 : 12, paddingBottom: 15, minHeight: 67, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  topDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.055)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 12, height: 12, borderRadius: 7, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', shadowColor: C.lime, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  brandMarkCore: { width: 4, height: 4, borderRadius: 3, backgroundColor: '#FFFAB2' },
  brandMarkSmall: { width: 7, height: 7, borderRadius: 5, backgroundColor: C.lime },
  brandName: { color: C.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.8 },
  brandNameLight: { color: C.ink2, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, borderColor: C.stroke, backgroundColor: 'rgba(255,255,255,0.025)', alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', right: 8, top: 7, width: 5, height: 5, borderRadius: 3, backgroundColor: C.lime },
  avatar: { borderRadius: 100, backgroundColor: 'rgba(224,243,74,0.08)', borderWidth: 1, borderColor: C.strokeStrong, alignItems: 'center', justifyContent: 'center' },
  headerSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderColor: C.stroke, borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, minHeight: 38 },
  headerSearchInput: { flex: 1, color: C.ink, paddingVertical: 7, fontSize: 13 },

  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, gap: 12 },
  eyebrow: { color: C.lime, fontSize: 9, letterSpacing: 1.8, fontWeight: '800', marginBottom: 9 },
  greetingTitle: { color: C.ink, fontSize: 27, lineHeight: 33, letterSpacing: -1.1, fontWeight: '700' },
  greetingAccent: { color: C.lime },
  greetingSub: { color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  avatarLarge: { width: 49, height: 49, borderRadius: 18, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarLetter: { color: C.black, fontWeight: '800', fontSize: 19 },
  avatarStatus: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, borderWidth: 2, borderColor: C.canvas, bottom: -1, right: -1 },

  heroCard: { borderRadius: 25, borderWidth: 1, borderColor: 'rgba(213,180,112,0.19)', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, overflow: 'hidden', marginBottom: 29, shadowColor: '#000', shadowOpacity: 0.20, shadowRadius: 25, shadowOffset: { width: 0, height: 13 }, elevation: 7 },
  heroGlow: { position: 'absolute', top: -80, right: -35, width: 220, height: 220, borderRadius: 120, backgroundColor: 'rgba(224,243,74,0.075)' },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(224,243,74,0.10)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.13)', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 6 },
  heroPillText: { color: C.lime, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  heroDate: { color: C.muted, fontSize: 11 },
  heroTitle: { color: C.ink, fontSize: 29, lineHeight: 34, fontWeight: '800', letterSpacing: -1.25 },
  heroDescription: { color: C.ink2, fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 360 },
  heroBottomRow: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroStats: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  heroCount: { color: C.lime, fontSize: 32, fontWeight: '800', letterSpacing: -1.5 },
  heroStatLabel: { color: C.ink2, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  heroStatHint: { color: C.muted, fontSize: 10, marginTop: 4 },
  heroAction: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.lime, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  heroActionText: { color: C.black, fontSize: 12, fontWeight: '800' },

  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.45 },
  sectionSubtitle: { color: C.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  pastDaysToggle: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pastDaysToggleText: {
    color: C.ink2,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateMonthButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: C.stroke },
  dateMonthText: { color: C.ink2, fontSize: 10, fontWeight: '600' },
  dateStrip: { gap: 8, paddingBottom: 25, paddingRight: 10 },
  dateTile: { width: 50, height: 65, backgroundColor: 'rgba(255,255,255,0.032)', borderRadius: 17, borderWidth: 1, borderColor: C.stroke, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dateTileSelected: { backgroundColor: C.lime, borderColor: C.lime, shadowColor: C.lime, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  dateNumber: { color: C.ink, fontWeight: '800', fontSize: 19 },
  dateNumberSelected: { color: C.black },
  dateDay: { color: C.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  dateDaySelected: { color: '#353B0C' },
  dateIndicator: { position: 'absolute', bottom: 5, width: 3, height: 3, borderRadius: 2, backgroundColor: '#737E18' },
  smallIconButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: C.stroke, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  filterChip: { borderRadius: 11, borderWidth: 1, borderColor: C.stroke, backgroundColor: 'rgba(255,255,255,0.025)', paddingVertical: 9, paddingHorizontal: 12 },
  filterChipActive: { backgroundColor: C.lime, borderColor: C.lime },
  filterChipText: { color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  filterChipTextActive: { color: C.black },
  timelineList: { gap: 3 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: 94 },
  timelineTimeCol: { width: 43, paddingTop: 19, alignItems: 'flex-start' },
  timelineTime: { color: C.ink2, fontSize: 11, fontWeight: '700' },
  timelineAmPm: { color: C.muted2, fontSize: 8, marginTop: 3 },
  timelineRail: { width: 18, alignItems: 'center', paddingTop: 21 },
  timelineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#655E50', borderWidth: 1, borderColor: C.canvas, zIndex: 2 },
  timelineDotUrgent: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.lime },
  timelineLine: { position: 'absolute', top: 28, bottom: -3, width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  floatingNoteCard: { flex: 1, marginBottom: 17, marginTop: 5, minHeight: 143, borderRadius: 24, borderWidth: 1, paddingHorizontal: 15, paddingTop: 14, paddingBottom: 13, overflow: 'hidden', shadowOpacity: 0.28, shadowRadius: 22, shadowOffset: { width: 0, height: 11 }, elevation: 9 },
  noteTopSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.62)' },
  noteAmbientOrb: { position: 'absolute', width: 150, height: 150, borderRadius: 90, top: -94, right: -50, backgroundColor: 'rgba(255,255,255,0.12)' },
  floatingNoteAccent: { position: 'absolute', left: 0, top: 17, bottom: 17, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  floatingNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  floatingNoteSourceIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  floatingNoteSource: { fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  floatingNoteImportant: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  floatingNoteImportantText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.65 },
  floatingNoteComplete: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  floatingNoteTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800', letterSpacing: -0.25, marginTop: 12, marginLeft: 1 },
  floatingNoteExcerpt: { fontSize: 10, lineHeight: 15, marginTop: 5, marginLeft: 1 },
  floatingNoteFooter: { borderTopWidth: 1, marginTop: 11, paddingTop: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  floatingNoteDeadline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  floatingNoteDeadlineText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.45 },
  floatingNoteOpen: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  sourceInsight: { marginTop: 14, padding: 14, backgroundColor: 'rgba(224,243,74,0.045)', borderColor: 'rgba(224,243,74,0.12)', borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceInsightIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: 'rgba(224,243,74,0.09)', alignItems: 'center', justifyContent: 'center' },
  sourceInsightTitle: { color: C.ink, fontWeight: '700', fontSize: 12 },
  sourceInsightBody: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },

  bottomNavOuter: { paddingHorizontal: 17, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 21 : 13, backgroundColor: 'transparent', position: 'relative' },
  bottomNavBlur: { position: 'absolute', top: 7, bottom: Platform.OS === 'ios' ? 21 : 13, left: 17, right: 17, borderRadius: 30, overflow: 'hidden' },
  bottomNavGloss: { position: 'absolute', top: 7, left: 35, right: 35, height: 1, backgroundColor: 'rgba(255,255,255,0.17)', zIndex: 1 },
  bottomNav: { borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(34,29,23,0.62)', minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5, shadowColor: '#000', shadowOpacity: 0.34, shadowRadius: 26, shadowOffset: { width: 0, height: 9 }, elevation: 12, overflow: 'visible' },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0, gap: 3 },
  navIconWrap: { minWidth: 34, height: 30, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  navIconWrapActive: { backgroundColor: 'rgba(224,243,74,0.08)' },
  navLabel: { color: C.muted2, fontSize: 8, fontWeight: '600' },
  navLabelActive: { color: C.lime },
  navAdd: { width: 54, height: 54, borderRadius: 20, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', marginHorizontal: 7, marginTop: -21, borderWidth: 4, borderColor: '#211D17', shadowColor: C.lime, shadowOpacity: 0.34, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 9 },

  pageTitle: { color: C.ink, fontSize: 31, fontWeight: '800', letterSpacing: -1.15, marginBottom: 7 },
  pageSubtitle: { color: C.muted, fontSize: 12, lineHeight: 19, marginBottom: 25, maxWidth: 430 },
  sectionLabelWrap: { marginTop: 24, marginBottom: 11 },
  sectionLabelTitle: { color: C.ink, fontSize: 13, fontWeight: '700' },
  sectionLabelDetail: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },

  activityHero: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 19, backgroundColor: 'rgba(224,243,74,0.06)', borderColor: 'rgba(224,243,74,0.14)', borderWidth: 1, alignItems: 'center', marginBottom: 22 },
  activityHeroTitle: { color: C.ink, fontSize: 13, fontWeight: '700' },
  activityHeroBody: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.stroke },
  activityTaskTitle: { color: C.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  activityTaskSubtitle: { color: C.muted, fontSize: 10, marginTop: 5 },
  emptyState: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 34, borderRadius: 23, borderWidth: 1, borderColor: C.stroke, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.015)' },
  emptyStateIcon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: 'rgba(224,243,74,0.09)', marginBottom: 12 },
  emptyStateTitle: { color: C.ink, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 300 },
  emptyStateButton: { backgroundColor: C.lime, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, marginTop: 15 },
  emptyStateButtonText: { color: C.black, fontSize: 11, fontWeight: '800' },

  overlayRoot: { ...StyleSheet.absoluteFill, zIndex: 50, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 0 },
  overlayDimmer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,5,4,0.64)' },
  sheetKeyboardWrap: { width: '100%', maxWidth: 620, height: Platform.OS === 'web' ? '90%' : undefined, flex: 1, maxHeight: '94%', alignSelf: 'center', justifyContent: 'flex-end', zIndex: 10 },
  sheetHandle: { width: 39, height: 4, borderRadius: 4, backgroundColor: 'rgba(242,238,223,0.24)', alignSelf: 'center', marginBottom: 17 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 15, marginBottom: 20 },
  sheetEyebrow: { color: C.lime, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  sheetClose: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: C.stroke, alignItems: 'center', justifyContent: 'center' },
  captureBodyScroll: { flexShrink: 1, minHeight: 0 },

  alertCardWrap: { width: '100%', maxWidth: 525, paddingHorizontal: 15, alignSelf: 'center', justifyContent: 'center', zIndex: 2 },
  alertCard: { borderRadius: 28, borderWidth: 1, borderColor: 'rgba(242,231,206,0.20)', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.46, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 18 },
  alertCardGradient: { padding: 20 },
  alertTopLine: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  alertBrandIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  alertOverline: { color: C.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  alertTime: { color: C.muted, fontSize: 10, marginTop: 4 },
  alertClose: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
  alertContent: { paddingTop: 20, paddingBottom: 16 },
  alertTaskTitle: { color: C.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.6, lineHeight: 27 },
  alertExcerpt: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  alertMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  alertMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.stroke },
  alertMetaText: { color: C.ink2, fontSize: 9, fontWeight: '600' },
  alertActions: { flexDirection: 'row', gap: 9 },
  alertDone: { flex: 1, minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, backgroundColor: C.lime },
  alertDoneText: { color: C.black, fontSize: 12, fontWeight: '900' },
  alertSnooze: { flex: 1.25, minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: C.stroke },
  alertSnoozeText: { color: C.ink, fontSize: 11, fontWeight: '700' },
  alertDetailsLink: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 15 },
  alertDetailsText: { color: C.muted, fontSize: 10, fontWeight: '700' },

  detailsTitle: { color: C.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.7, marginTop: 2 },
  detailsStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 15 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.lime },
  detailsStatusText: { color: C.muted, fontSize: 10, fontWeight: '600' },
  detailProfileChip: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(224,243,74,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  detailProfileText: { color: C.lime, fontSize: 9, fontWeight: '800' },
  detailInfoGrid: { flexDirection: 'row', gap: 9 },
  detailInfoCard: { flex: 1, padding: 13, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: C.stroke },
  detailInfoLabel: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 12 },
  detailInfoValue: { color: C.ink, fontSize: 12, fontWeight: '800', marginTop: 4 },
  detailExcerptBox: { backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: C.stroke, borderRadius: 16, padding: 13 },
  detailExcerptHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sourceLabel: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.05 },
  detailExcerptText: { color: C.ink2, fontSize: 11, fontStyle: 'italic', lineHeight: 17, marginTop: 10 },
  openSourceButton: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 12, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(224,243,74,0.065)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.12)' },
  openSourceButtonText: { color: C.lime, fontSize: 10, fontWeight: '700' },
  detailActions: { flexDirection: 'row', gap: 9 },
  detailSnooze: { minHeight: 50, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: C.stroke, backgroundColor: 'rgba(255,255,255,0.04)' },
  detailSnoozeText: { color: C.ink2, fontSize: 11, fontWeight: '700' },
  snoozeChips: { flexDirection: 'row', gap: 7, marginTop: 10 },
  snoozeChip: { flex: 1, borderRadius: 10, padding: 9, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.stroke },
  snoozeChipText: { color: C.muted, fontSize: 9, fontWeight: '700' },
  captureSave: { flex: 1, minHeight: 51, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.lime, paddingHorizontal: 12 },
  captureSaveText: { color: C.black, fontSize: 12, fontWeight: '900' },

  fullscreenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#E8F0E3', padding: 0, margin: 0 },
  onboardingRoot: { width: '100%', maxWidth: 580, maxHeight: '100%', flex: 1, alignSelf: 'center' },
  onboardingPanel: { flex: 1, borderRadius: 31, paddingHorizontal: 21, paddingTop: 17, paddingBottom: 15, overflow: 'hidden' },
  onboardingTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 31 },
  onboardingBrandDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#24462A' },
  onboardingBrand: { color: '#153720', fontSize: 17, fontWeight: '900', letterSpacing: -0.7 },
  onboardingClose: { width: 31, height: 31, borderRadius: 11, backgroundColor: 'rgba(20,48,29,0.08)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  onboardingIllustration: { height: 226, marginTop: 17, marginBottom: 15, borderRadius: 24, backgroundColor: 'rgba(34,68,43,0.075)', borderWidth: 1, borderColor: 'rgba(25,60,35,0.06)', overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 18 },
  orbit: { position: 'absolute', borderRadius: 200, borderWidth: 1, borderColor: 'rgba(31,66,40,0.12)' },
  orbitOne: { width: 265, height: 265, top: -115, right: -63 },
  orbitTwo: { width: 190, height: 190, bottom: -108, left: -49 },
  illusMiniTag: { position: 'absolute', top: 19, left: 18, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(22,58,32,0.16)', backgroundColor: 'rgba(250,250,241,0.70)' },
  illusMiniTagText: { color: '#25432C', fontSize: 9, fontWeight: '700' },
  illusMessageCard: { borderRadius: 17, padding: 12, backgroundColor: 'rgba(249,250,242,0.88)', borderWidth: 1, borderColor: 'rgba(25,60,35,0.12)', transform: [{ rotate: '-2deg' }], shadowColor: '#34513A', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  illusMessageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  illusAvatar: { width: 30, height: 30, borderRadius: 11, backgroundColor: '#E1E9DA', alignItems: 'center', justifyContent: 'center' },
  illusAvatarText: { color: '#173A23', fontSize: 12, fontWeight: '900' },
  illusSender: { color: '#1A3923', fontSize: 10, fontWeight: '800' },
  illusMessageSub: { color: '#718071', fontSize: 8, marginTop: 2 },
  illusLink: { width: 27, height: 27, borderRadius: 9, backgroundColor: '#E4ECDD', alignItems: 'center', justifyContent: 'center' },
  illusQuote: { color: '#324D37', fontSize: 12, lineHeight: 17, marginTop: 11, fontWeight: '600' },
  illusArrow: { position: 'absolute', bottom: -12, right: 12, width: 30, height: 30, borderRadius: 11, backgroundColor: '#173B23', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#D9E4D6' },
  illusReminderCard: { position: 'absolute', bottom: 15, right: 13, left: 43, borderRadius: 14, backgroundColor: C.lime, paddingHorizontal: 11, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(29,55,28,0.13)', shadowColor: '#1D3D26', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  illusReminderIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: 'rgba(15,35,18,0.1)', alignItems: 'center', justifyContent: 'center' },
  illusReminderLabel: { color: '#344314', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  illusReminderText: { color: '#172E1C', fontSize: 11, fontWeight: '800', marginTop: 3 },
  illusSpark: { position: 'absolute', right: 24, top: 25 },
  onboardingCopy: { flex: 1, minHeight: 0 },
  onboardingHeadline: { color: '#102F1A', fontSize: 32, lineHeight: 35, letterSpacing: -1.3, fontWeight: '900' },
  onboardingDescription: { color: '#536854', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 11 },
  onboardingFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  onboardingFeatureIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(20,59,31,0.075)', alignItems: 'center', justifyContent: 'center' },
  onboardingFeatureTitle: { color: '#183B23', fontSize: 11, fontWeight: '800' },
  onboardingFeatureText: { color: '#657666', fontSize: 9, lineHeight: 13, marginTop: 3 },
  onboardingActions: { marginTop: 13, gap: 4 },
  onboardingPrimary: { minHeight: 52, backgroundColor: '#10321B', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  onboardingPrimaryText: { color: '#F6F4EA', fontSize: 12, fontWeight: '800' },
  onboardingSkip: { alignItems: 'center', paddingVertical: 9 },
  onboardingSkipText: { color: '#526852', fontSize: 10, fontWeight: '700' },

  rPageIntro: { marginBottom: 17 },
  rPageTitle: { color: C.ink, fontSize: 33, lineHeight: 39, fontWeight: '800', letterSpacing: -1.35 },
  rPageSubtitle: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 7, maxWidth: 430 },
  rSectionTitle: { color: C.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.45 },
  rSectionSubtitle: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },

  rCalendarWeekHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 18, gap: 10 },
  rRoundArrow: { width: 37, height: 37, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  rWeekHeading: { color: C.ink, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  rWeekRange: { color: C.muted2, fontSize: 9, marginTop: 3 },
  rCalendarDays: { gap: 8, paddingRight: 8, paddingBottom: 20 },
  rCalendarDay: { width: 44, height: 66, borderRadius: 22, justifyContent: 'center', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.023)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.055)' },
  rCalendarDayActive: { backgroundColor: C.lime, borderColor: C.lime, shadowColor: C.lime, shadowOpacity: 0.19, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  rCalendarDayToday: { borderColor: 'rgba(224,243,74,0.28)' },
  rCalendarDow: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  rCalendarDowActive: { color: '#434A13' },
  rCalendarNum: { color: C.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  rCalendarNumActive: { color: C.black },
  rCalendarDayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  rCalendarDayDotActive: { backgroundColor: '#454D12' },
  rCalendarDayDotToday: { backgroundColor: C.lime },
  rCalendarPulse: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 17, marginBottom: 27, borderRadius: 22, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.035)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.12)' },
  rCalendarPulseGlow: { position: 'absolute', top: -65, right: -20, width: 155, height: 130, borderRadius: 80, backgroundColor: 'rgba(224,243,74,0.035)' },
  rCalendarMetric: { alignItems: 'center', minWidth: 55 },
  rCalendarMetricNumber: { color: C.lime, fontSize: 24, lineHeight: 27, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  rCalendarMetricLabel: { color: C.muted2, fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 5 },
  rCalendarMetricRule: { height: 28, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  rCalendarListHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  rAddRound: { width: 36, height: 36, borderRadius: 14, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', shadowColor: C.lime, shadowOpacity: 0.17, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  rCalendarList: { gap: 10 },
  rCalendarTask: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: 'rgba(47,40,31,0.52)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  rCalendarTimeRail: { width: 59, alignSelf: 'stretch', minHeight: 58, borderRadius: 14, backgroundColor: 'rgba(224,243,74,0.09)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  rCalendarTimeRailUrgent: { backgroundColor: C.lime },
  rCalendarTimeLabel: { color: C.lime, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rCalendarTimeLabelUrgent: { color: C.black },
  rCalendarTimeSuffix: { color: C.muted, fontSize: 8, fontWeight: '800', marginTop: 2 },
  rCalendarTimeSuffixUrgent: { color: '#40480D' },
  rCalendarTaskBody: { flex: 1, minWidth: 0 },
  rCalendarTaskMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  rCalendarSource: { color: C.muted, fontSize: 7, fontWeight: '800', letterSpacing: 0.9 },
  rImportantDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.lime, marginLeft: 2 },
  rCalendarTaskTitle: { color: C.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  rCalendarTaskExcerpt: { color: C.muted2, fontSize: 9, marginTop: 4 },
  rCalendarEmpty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.075)', backgroundColor: 'rgba(255,255,255,0.023)' },
  rCalendarEmptyGlyph: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,243,74,0.09)', marginBottom: 12 },
  rCalendarEmptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  rCalendarEmptyBody: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 6, textAlign: 'center', maxWidth: 290 },
  rCalendarEmptyAction: { marginTop: 14, backgroundColor: C.lime, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  rCalendarEmptyActionText: { color: C.black, fontSize: 10, fontWeight: '800' },
  rCalendarBottomNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  rCalendarBottomNoteText: { color: C.muted2, fontSize: 8 },

  rInboxTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rInboxCount: { width: 68, height: 68, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(224,243,74,0.16)', backgroundColor: 'rgba(224,243,74,0.065)', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }] },
  rInboxCountNumber: { color: C.lime, fontSize: 24, fontWeight: '800', lineHeight: 26 },
  rInboxCountLabel: { color: C.muted, fontSize: 7, fontWeight: '800', letterSpacing: 0.7, marginTop: 4 },
  rInboxPrinciple: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, paddingHorizontal: 14, marginTop: 1, marginBottom: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(224,243,74,0.045)', borderTopWidth: 1, borderTopColor: 'rgba(224,243,74,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(224,243,74,0.06)' },
  rInboxPrincipleIcon: { width: 38, height: 38, borderRadius: 15, backgroundColor: 'rgba(224,243,74,0.095)', alignItems: 'center', justifyContent: 'center' },
  rInboxPrincipleTitle: { color: C.ink, fontSize: 12, fontWeight: '800' },
  rInboxPrincipleText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  rPrincipleSpark: { opacity: 0.75, paddingLeft: 2 },
  rInboxFilters: { gap: 7, paddingRight: 9, paddingBottom: 23 },
  rInboxFilter: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.026)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)' },
  rInboxFilterActive: { backgroundColor: 'rgba(224,243,74,0.105)', borderColor: 'rgba(224,243,74,0.32)' },
  rInboxFilterText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  rInboxFilterTextActive: { color: C.lime },
  rInboxFilterCount: { color: C.muted2, fontSize: 8, fontWeight: '800', minWidth: 10, textAlign: 'center' },
  rInboxFilterCountActive: { color: C.lime },
  rInboxListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  rInboxList: { gap: 12 },
  rInboxCard: { borderRadius: 25, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(237,223,193,0.13)', shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  rInboxCardOffset: { marginLeft: 5, marginRight: 1 },
  rInboxCardSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.30)' },
  rInboxCardAccent: { position: 'absolute', top: 20, bottom: 20, left: 0, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  rInboxCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  rInboxSourceIcon: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rInboxSourceName: { color: C.ink2, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  rInboxWhen: { color: C.muted2, fontSize: 8, marginTop: 3 },
  rInboxNeedsDate: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.13)' },
  rInboxNeedsDateDot: { width: 5, height: 5, borderRadius: 3 },
  rInboxNeedsDateText: { color: C.ink2, fontSize: 7, fontWeight: '800', letterSpacing: 0.3 },
  rInboxTaskTitle: { color: C.ink, fontSize: 15, lineHeight: 20, fontWeight: '800', letterSpacing: -0.35, marginTop: 15 },
  rInboxTaskExcerpt: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  rInboxCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.075)' },
  rInboxAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rInboxActionText: { color: C.lime, fontSize: 10, fontWeight: '800' },
  rInboxOpen: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rInboxOpenText: { color: C.muted, fontSize: 9, fontWeight: '700' },
  rInboxEmpty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 22, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.027)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.075)' },
  rInboxEmptyIcon: { width: 49, height: 49, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,243,74,0.08)', marginBottom: 12 },
  rInboxEmptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  rInboxEmptyText: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 7, maxWidth: 270 },
  rInboxEmptyButton: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: C.lime, marginTop: 15 },
  rInboxEmptyButtonText: { color: C.black, fontSize: 10, fontWeight: '800' },
  rInboxAddAnother: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 18, padding: 13, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.028)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.12)' },
  rInboxAddPlus: { width: 37, height: 37, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.lime },
  rInboxAddTitle: { color: C.ink2, fontSize: 11, fontWeight: '800' },
  rInboxAddSubtitle: { color: C.muted2, fontSize: 9, lineHeight: 14, marginTop: 3 },

  rSettingsIntro: { marginBottom: 27 },
  rSettingsTitle: { color: C.ink, fontSize: 31, lineHeight: 36, fontWeight: '800', letterSpacing: -1.2, maxWidth: 340 },
  rSettingsSubtitle: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 380 },
  rSettingsLocalBadge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, marginTop: 15, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 30, backgroundColor: 'rgba(120,212,160,0.065)', borderWidth: 1, borderColor: 'rgba(120,212,160,0.14)' },
  rSettingsLocalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  rSettingsLocalText: { color: C.green, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  rSettingsSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 13, gap: 10 },
  rTinyLink: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 6, paddingLeft: 5 },
  rTinyLinkText: { color: C.lime, fontSize: 9, fontWeight: '800' },
  rDefaultProfileCard: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(224,243,74,0.17)', backgroundColor: 'rgba(41,35,26,0.66)' },
  rDefaultProfileIcon: { width: 43, height: 43, borderRadius: 16, backgroundColor: 'rgba(224,243,74,0.1)', alignItems: 'center', justifyContent: 'center' },
  rDefaultProfileOverline: { color: C.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  rDefaultProfileTitle: { color: C.ink, fontSize: 15, lineHeight: 19, fontWeight: '800' },
  rDefaultProfileDescription: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  rDefaultProfileChange: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 3 },
  rDefaultProfileChangeText: { color: C.lime, fontSize: 9, fontWeight: '800' },
  rProfileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 },
  rProfileChoice: { flexBasis: '48%', flexGrow: 1, minWidth: 125, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)' },
  rProfileChoiceSelected: { backgroundColor: 'rgba(224,243,74,0.065)', borderColor: 'rgba(224,243,74,0.28)' },
  rProfileChoiceMark: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  rProfileChoiceTitle: { color: C.ink2, fontSize: 11, fontWeight: '800' },
  rProfileChoiceDetail: { color: C.muted2, fontSize: 8, lineHeight: 13, marginTop: 4 },
  rSettingsOptions: { marginTop: 14, paddingHorizontal: 13, borderRadius: 21, backgroundColor: 'rgba(39,34,27,0.48)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.045)' },
  rSettingsOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 75, paddingVertical: 11 },
  rSettingsOptionIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.045)', alignItems: 'center', justifyContent: 'center' },
  rSettingsOptionIconActive: { backgroundColor: 'rgba(224,243,74,0.085)' },
  rSettingsOptionTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  rSettingsOptionDetail: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  rSettingsOptionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.065)', marginLeft: 47 },
  rTimeSelector: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(224,243,74,0.065)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.12)' },
  rTimeSelectorText: { color: C.lime, fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rDeliveryCard: { padding: 15, borderRadius: 23, backgroundColor: 'rgba(40,35,28,0.59)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.075)', overflow: 'hidden' },
  rDeliveryTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  rDeliveryIcon: { width: 39, height: 39, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(120,212,160,0.09)' },
  rDeliveryTitle: { color: C.ink, fontSize: 12, fontWeight: '800' },
  rDeliverySubtitle: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  rDeliveryStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.amber, marginLeft: 3 },
  rDeliveryRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.075)', marginTop: 15, marginBottom: 12 },
  rDeliveryFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, flexWrap: 'wrap' },
  rDemoTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 6, borderRadius: 9, backgroundColor: 'rgba(200,141,86,0.075)' },
  rDemoTagDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.amber },
  rDemoTagText: { color: C.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  rTestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, backgroundColor: C.lime },
  rTestButtonText: { color: C.black, fontSize: 9, fontWeight: '900' },
  rSettingsPermissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rSettingsPermissionButtonText: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '700',
  },
  rDeliveryDisclaimer: { color: C.muted2, fontSize: 8, lineHeight: 13, marginTop: 10 },
  rAppearanceCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 22, backgroundColor: 'rgba(42,36,28,0.53)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)' },
  rAppearanceVisual: { width: 91, height: 72, borderRadius: 15, overflow: 'hidden', position: 'relative', padding: 9, justifyContent: 'center' },
  rAppearanceGlow: { position: 'absolute', width: 59, height: 59, borderRadius: 30, top: -23, right: -10, backgroundColor: 'rgba(224,243,74,0.13)' },
  rAppearanceMiniCard: { height: 30, width: 47, borderRadius: 8, backgroundColor: 'rgba(240,232,211,0.89)', padding: 6, alignSelf: 'flex-start', transform: [{ rotate: '-4deg' }] },
  rAppearanceMiniDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CB04B', marginBottom: 3 },
  rAppearanceMiniLineLong: { width: 32, height: 2, borderRadius: 2, backgroundColor: '#5F6244', marginBottom: 2 },
  rAppearanceMiniLineShort: { width: 21, height: 2, borderRadius: 2, backgroundColor: '#9CA084' },
  rAppearanceMiniDock: { position: 'absolute', bottom: 6, left: 9, right: 9, height: 13, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(26,22,16,0.77)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  rAppearanceMiniDockActive: { width: 8, height: 8, borderRadius: 3, backgroundColor: C.lime },
  rAppearanceTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  rAppearanceSubtitle: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  rAppearanceNote: { color: C.lime, fontSize: 8, fontWeight: '800', marginTop: 6 },
  rPrivacyCard: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, paddingHorizontal: 13, borderRadius: 20, backgroundColor: 'rgba(120,212,160,0.035)', borderWidth: 1, borderColor: 'rgba(120,212,160,0.095)' },
  rPrivacyIcon: { width: 38, height: 38, borderRadius: 15, backgroundColor: 'rgba(120,212,160,0.085)', alignItems: 'center', justifyContent: 'center' },
  rPrivacyTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  rPrivacySubtitle: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  rPrivacyExpanded: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 13, marginTop: 5, borderLeftWidth: 1, borderLeftColor: 'rgba(120,212,160,0.24)', marginLeft: 14 },
  rPrivacyExpandedText: { color: C.muted, fontSize: 9, lineHeight: 15 },
  rOnboardingLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 19, padding: 13, borderRadius: 19, backgroundColor: 'rgba(224,243,74,0.045)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.12)' },
  rOnboardingLinkIcon: { width: 35, height: 35, borderRadius: 13, backgroundColor: 'rgba(224,243,74,0.085)', alignItems: 'center', justifyContent: 'center' },
  rOnboardingLinkTitle: { color: C.ink2, fontSize: 10, fontWeight: '800' },
  rOnboardingLinkText: { color: C.muted2, fontSize: 8, lineHeight: 12, marginTop: 3 },
  rSettingsFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 20, marginBottom: 11 },
  rSettingsFooterBrand: { color: C.muted, fontSize: 9, fontWeight: '800' },
  rSettingsFooterDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.lime },
  rSettingsFooterText: { color: C.muted2, fontSize: 8 },

  rCaptureSheet: { flex: 1, width: '100%', backgroundColor: 'rgba(31,26,20,0.95)', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,244,218,0.24)', paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.64, shadowRadius: 37, shadowOffset: { width: 0, height: -14 }, elevation: 25 },
  rCaptureGlow: { position: 'absolute', top: -105, right: -54, width: 230, height: 220, borderRadius: 130, backgroundColor: 'rgba(186,145,72,0.105)' },
  rCaptureSheen: { position: 'absolute', left: 18, right: 18, top: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.26)' },
  rCaptureHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 19 },
  rCaptureEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  rCaptureEyebrow: { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.35 },
  rCaptureStep: { color: C.muted2, fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  rCaptureTitle: { color: C.ink, fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.95 },
  rCaptureSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5, maxWidth: 300 },
  rCaptureClose: { width: 35, height: 35, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center' },
  rCaptureSourceTeaser: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 11, borderRadius: 18, marginBottom: 14, backgroundColor: 'rgba(224,243,74,0.045)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.12)' },
  rCaptureSourceIcon: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,243,74,0.085)' },
  rCaptureSourceMeta: { color: C.lime, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
  rCaptureSourceLine: { color: C.ink2, fontSize: 10, lineHeight: 15 },
  rCaptureBody: { paddingTop: 1, paddingBottom: 8 },
  rCaptureFieldHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  rCaptureFieldLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  rCaptureFieldHint: { color: C.lime, fontSize: 7, fontWeight: '900', letterSpacing: 0.75 },
  rCaptureTitleBox: { minHeight: 59, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  rCaptureTitleInput: { minHeight: 38, paddingVertical: 3, color: C.ink, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  
  importantToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
  },
  importantToggleCardActive: {
    backgroundColor: 'rgba(255,107,74,0.08)',
    borderColor: 'rgba(255,107,74,0.3)',
  },
  importantIconBox: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  importantIconBoxActive: {
    backgroundColor: 'rgba(255,107,74,0.18)',
  },
  importantToggleTitle: {
    color: C.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  importantToggleTitleActive: {
    color: '#FF8866',
  },
  importantToggleSub: {
    color: C.muted,
    fontSize: 8,
    lineHeight: 12,
    marginTop: 2,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,107,74,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,74,0.35)',
    marginLeft: 6,
  },
  importantBadgeText: {
    color: '#FF8866',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  rCaptureSourceSection: {
    marginTop: 10,
    marginBottom: 8,
  },
  rCaptureSourceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(224,243,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224,243,74,0.25)',
  },
  rDetectedBadgeText: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rCaptureSourceScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  rCaptureSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  rCaptureSourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rCaptureSourceChipActive: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  rCaptureSourceChipText: {
    color: C.ink2,
    fontSize: 10,
    fontWeight: '800',
  },
  rCaptureSourceChipTextActive: {
    color: C.black,
    fontWeight: '900',
  },
  rPermissionActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(224,243,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224,243,74,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rPermissionActionBtnGranted: {
    backgroundColor: 'rgba(100,200,100,0.12)',
    borderColor: 'rgba(100,200,100,0.3)',
  },
  rPermissionActionBtnText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '800',
  },
  rPermissionActionBtnTextGranted: {
    color: '#86EFAC',
  },
  rStopServiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(235,94,85,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(235,94,85,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rStopServiceBtnText: {
    color: '#EB5E55',
    fontSize: 11,
    fontWeight: '800',
  },
  rPastTimeWarning: {
    color: '#FF7B54',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  rCaptureSectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 19, marginBottom: 9 },
  rCaptureSectionNote: { color: C.muted2, fontSize: 8 },
  rDeadlineChoices: { flexDirection: 'row', gap: 7 },
  rDeadlineChoice: { flex: 1, minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)' },
  rDeadlineChoiceActive: { backgroundColor: C.lime, borderColor: C.lime },
  rDeadlineChoiceText: { color: C.muted, fontSize: 9, fontWeight: '800' },
  rDeadlineChoiceTextActive: { color: C.black },
  rDeadlineEditor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 10, marginTop: 9, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.038)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.075)' },
  rDeadlineIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,243,74,0.085)' },
  rDeadlineOverline: { color: C.muted2, fontSize: 7, fontWeight: '900', letterSpacing: 0.9, marginBottom: 4 },
  rDeadlineInput: { color: C.ink, fontSize: 11, fontWeight: '800', padding: 0, minHeight: 20 },
  rDeadlineEditMark: { width: 26, alignItems: 'center', justifyContent: 'center' },
  rInboxModeNote: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderRadius: 16, marginTop: 9, paddingHorizontal: 12, backgroundColor: 'rgba(224,243,74,0.055)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.11)' },
  rInboxModeText: { color: C.ink2, fontSize: 10, fontWeight: '600' },
  rCaptureHelper: { color: C.muted2, fontSize: 8, lineHeight: 13, marginTop: 7, marginLeft: 2 },
  rProfileSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 11, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.075)' },
  rProfileSelectorIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,243,74,0.085)' },
  rProfileSelectorOverline: { color: C.muted2, fontSize: 7, fontWeight: '900', letterSpacing: 0.9, marginBottom: 3 },
  rProfileSelectorTitle: { color: C.ink, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  rProfileSelectorSummary: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
  rProfileSelectorChange: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 4 },
  rProfileSelectorChangeText: { color: C.lime, fontSize: 8, fontWeight: '800' },
  rCaptureProfileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  rCaptureProfileChoice: { flexBasis: '48%', flexGrow: 1, minWidth: 128, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)' },
  rCaptureProfileChoiceSelected: { backgroundColor: 'rgba(224,243,74,0.065)', borderColor: 'rgba(224,243,74,0.26)' },
  rCaptureProfileName: { color: C.ink2, fontSize: 9, fontWeight: '800' },
  rCaptureProfileDescription: { color: C.muted2, fontSize: 7, lineHeight: 11, marginTop: 3 },
  rSourceDisclosure: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 11, marginTop: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.065)' },
  rSourceDisclosureIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.035)' },
  rSourceDisclosureTitle: { color: C.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  rSourceDisclosureText: { color: C.muted2, fontSize: 8, marginTop: 3 },
  rSourceDisclosureAction: { color: C.lime, fontSize: 8, fontWeight: '800' },
  rSourcePreview: { padding: 12, marginBottom: 3, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  rSourcePreviewQuote: { color: C.ink2, fontSize: 10, lineHeight: 16, fontStyle: 'italic' },
  rSourceNoLink: { color: C.muted2, fontSize: 8, marginTop: 7 },
  rCaptureButtonRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  rCaptureCancel: { minWidth: 78, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.025)' },
  captureCancelText: { color: C.ink2, fontSize: 11, fontWeight: '700' },
  rCaptureSave: { flex: 1, minHeight: 51, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.lime, paddingHorizontal: 12, shadowColor: C.lime, shadowOpacity: 0.18, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  rCaptureSaveText: { color: C.black, fontSize: 11, fontWeight: '900' },
  rCapturePrivacy: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 5, marginTop: 10 },
  rCapturePrivacyText: { color: C.muted, fontSize: 8 },

  rCaptureProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(224,243,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224,243,74,0.25)',
  },
  rCaptureProfileBadgeText: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  detailsSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailsEditInput: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  detailsSaveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailsSaveBtnText: {
    color: C.black,
    fontSize: 13,
    fontWeight: '800',
  },
  detailsCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  detailsCancelBtnText: {
    color: C.ink2,
    fontSize: 13,
    fontWeight: '600',
  },
  detailsManagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  detailsEditButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(224,243,74,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,243,74,0.18)',
  },
  detailsEditButtonText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '700',
  },
  detailsDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(235,94,85,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235,94,85,0.2)',
  },
  detailsDeleteButtonText: {
    color: C.red,
    fontSize: 11,
    fontWeight: '700',
  },
  rDetailsSheet: { position: 'relative', width: '100%', maxHeight: '94%', backgroundColor: 'rgba(31,26,20,0.78)', borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,244,218,0.23)', paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.52, shadowRadius: 31, shadowOffset: { width: 0, height: -12 }, elevation: 22 },
  rDetailsGlow: { position: 'absolute', top: -90, right: -60, width: 210, height: 185, borderRadius: 110, backgroundColor: 'rgba(169,132,69,0.09)' },

  toastWrap: { position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 105 : 91, alignItems: 'center', zIndex: 100 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(224,243,74,0.18)', backgroundColor: '#252219', paddingHorizontal: 14, paddingVertical: 11, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  toastText: { color: C.ink, fontSize: 11, fontWeight: '700' },

  // Fullscreen Onboarding Coverage
  onboardingFullscreen: { flex: 1, width: '100%', height: '100%', backgroundColor: '#E8F0E3' },
  onboardingPanelFull: { flex: 1, width: '100%', height: '100%', paddingHorizontal: 22, overflow: 'hidden' },
  onboardingGoogleBtn: { minHeight: 52, backgroundColor: '#FFFFFF', borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 8 },
  onboardingGoogleText: { color: '#1F1F1F', fontSize: 14, fontWeight: '700' },
  googleIconBox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  // Month & Year Picker Sheet
  yearSelectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16 },
  yearNavBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  yearSelectTitle: { color: C.ink, fontSize: 18, fontWeight: '800' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  monthTile: { flexBasis: '22%', flexGrow: 1, height: 44, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  monthTileSelected: { backgroundColor: C.lime, borderColor: C.lime },
  monthTileText: { color: C.ink2, fontSize: 12, fontWeight: '700' },
  monthTileTextSelected: { color: C.black, fontWeight: '800' },
  currentMonthDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: C.lime },
  jumpTodayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: C.lime },
  jumpTodayText: { color: C.black, fontSize: 12, fontWeight: '800' },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },

  // Dynamic Date Strip in TodayScreen
  dateTileToday: { borderColor: 'rgba(215,239,72,0.45)', backgroundColor: 'rgba(215,239,72,0.06)' },

  // Custom Date Strip in Quick Capture
  customDateStripWrap: { marginTop: 12, marginBottom: 4 },
  customDateStripLabel: { color: C.muted2, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8 },
  customDaysList: { gap: 8, paddingBottom: 6 },
  customDayChip: { width: 56, height: 68, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', gap: 3 },
  customDayChipActive: { backgroundColor: C.lime, borderColor: C.lime },
  customDayDow: { color: C.muted, fontSize: 8, fontWeight: '800' },
  customDayDowActive: { color: '#3A420D' },
  customDayNum: { color: C.ink, fontSize: 16, fontWeight: '800' },
  customDayNumActive: { color: C.black },
  customDayMonth: { color: C.muted2, fontSize: 8, fontWeight: '700' },
  customDayMonthActive: { color: '#434C10' },

  // Tactile Time Picker in Quick Capture
  tactileTimeBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 12, marginBottom: 10 },
  tactileClockIcon: { width: 36, height: 36, borderRadius: 14, backgroundColor: 'rgba(224,243,74,0.12)', alignItems: 'center', justifyContent: 'center' },
  tactileTimeLabel: { color: C.muted2, fontSize: 8, fontWeight: '800', letterSpacing: 0.9 },
  tactileTimeValue: { color: C.ink, fontSize: 15, fontWeight: '800', marginVertical: 1 },
  tactileTimeHint: { color: C.lime, fontSize: 10, fontWeight: '600' },
  tactileChangePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(224,243,74,0.1)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.22)' },
  tactileChangeText: { color: C.lime, fontSize: 11, fontWeight: '800' },
  tactilePickerContainer: { padding: 14, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginVertical: 8 },

  // Flexible Minute Controls & Hour/AM-PM picker
  rPeriodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  rPickerLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginBottom: 7, marginTop: 4 },
  rAmPmSwitch: { flexDirection: 'row', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', padding: 3 },
  rAmPmBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 11 },
  rAmPmBtnActive: { backgroundColor: C.lime },
  rAmPmBtnText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  rAmPmBtnTextActive: { color: C.black },
  rHourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  rHourBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)', alignItems: 'center', justifyContent: 'center' },
  rHourBtnActive: { backgroundColor: C.lime, borderColor: C.lime },
  rHourBtnText: { color: C.ink, fontSize: 11, fontWeight: '800' },
  rHourBtnTextActive: { color: C.black },
  rMinuteLive: { color: C.lime, fontSize: 12, fontWeight: '900' },
  minuteStepperRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  minuteStepBtn: { flex: 1, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  minuteStepBtnText: { color: C.ink, fontSize: 10, fontWeight: '800' },
  minuteInputBox: { width: 54, height: 36, borderRadius: 11, backgroundColor: 'rgba(224,243,74,0.12)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.3)', alignItems: 'center', justifyContent: 'center' },
  minuteTextInput: { color: C.lime, fontSize: 16, fontWeight: '900', textAlign: 'center', padding: 0 },
  minuteChipsScroll: { gap: 6, paddingBottom: 4 },
  minuteChip: { width: 42, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  minuteChipActive: { backgroundColor: C.lime, borderColor: C.lime },
  minuteChipText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  minuteChipTextActive: { color: C.black, fontWeight: '900' },

  // Deadline / Date Row in Quick Capture
  rDeadlineRow: { flexDirection: 'row', gap: 7, marginTop: 4, marginBottom: 6 },
  rDeadlinePill: { flex: 1, minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.065)' },
  rDeadlinePillActive: { backgroundColor: C.lime, borderColor: C.lime },
  rDeadlinePillText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  rDeadlinePillTextActive: { color: C.black },
  rPresetScroll: { gap: 6, paddingVertical: 4 },
  rPresetBtn: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  rPresetText: { color: C.ink2, fontSize: 11, fontWeight: '700' },

  // Titles & Eyebrows in Quick Capture
  rTitleBox: { minHeight: 64, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.095)', borderWidth: 1.5, borderColor: 'rgba(224,243,74,0.35)', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  rTitleInput: { minHeight: 40, paddingVertical: 3, color: '#F8F5ED', fontSize: 15, lineHeight: 22, fontWeight: '700' },
  rCaptureBrandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.lime, marginRight: 6 },
  rCaptureEyebrowSub: { color: C.muted2, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  rCaptureHeading: { color: C.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  rCaptureSub: { color: C.muted, fontSize: 11, lineHeight: 15, marginTop: 2 },

  // Account Profile Sheet
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 18 },
  accountAvatarBig: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  accountAvatarLetter: { color: C.black, fontSize: 20, fontWeight: '900' },
  accountName: { color: C.ink, fontSize: 16, fontWeight: '800' },
  accountEmail: { color: C.ink2, fontSize: 12, marginVertical: 2 },
  accountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  accountBadgeText: { color: C.lime, fontSize: 10, fontWeight: '700' },
  accountActionsList: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  accountActionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  accountActionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(224,243,74,0.1)', alignItems: 'center', justifyContent: 'center' },
  accountActionTitle: { color: C.ink, fontSize: 13, fontWeight: '700' },
  accountActionSub: { color: C.muted, fontSize: 10, marginTop: 1 },

  // Sign In Sheet Styles
  onboardingEmailBtn: { minHeight: 46, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  onboardingEmailText: { color: '#1F1F1F', fontSize: 13, fontWeight: '700' },
  signInGoogleBtn: { minHeight: 52, backgroundColor: '#FFFFFF', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 16, marginTop: 4 },
  signInGoogleText: { color: '#1F1F1F', fontSize: 15, fontWeight: '700' },
  signInDividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 },
  signInDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  signInDividerText: { color: C.muted2, fontSize: 9, fontWeight: '800', letterSpacing: 0.75 },
  signInInputGroup: { marginBottom: 12 },
  signInInputLabel: { color: C.muted2, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  signInInputBox: { minHeight: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, justifyContent: 'center' },
  signInTextInput: { color: '#F8F5ED', fontSize: 14, fontWeight: '600' },
  signInDirectBtn: { minHeight: 52, backgroundColor: C.lime, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10, shadowColor: C.lime, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  signInDirectBtnText: { color: '#182312', fontSize: 14, fontWeight: '800' },
  signInQuickTestBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 18, backgroundColor: 'rgba(224,243,74,0.06)', borderWidth: 1, borderColor: 'rgba(224,243,74,0.18)', marginTop: 14 },
  signInQuickTestIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(224,243,74,0.12)', alignItems: 'center', justifyContent: 'center' },
  signInQuickTestTitle: { color: C.ink, fontSize: 12, fontWeight: '800' },
  signInQuickTestSub: { color: C.muted, fontSize: 10, marginTop: 2 },
});
