export type TaskStatus = 'overdue' | 'upcoming' | 'inbox' | 'done';
export type TaskSource = 'WhatsApp' | 'Gmail' | 'Outlook' | 'Slack' | 'Telegram' | 'Notes' | 'Web' | 'Manual' | 'Other';
export type TabKey = 'today' | 'calendar' | 'inbox' | 'activity' | 'settings';
export type OverlayKey = 'quick' | 'reminder' | 'detail' | 'onboarding' | null;
export type ProfileKey = 'Simple' | 'Standard' | 'Important' | 'Persistent';

export interface OmniTask {
  userId?: string;
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
  /** Canonical scheduling values. Labels are presentation only. */
  dueAtUtc?: string;
  dueLocalDate?: string;
  dueLocalTime?: string;
  dueTimezone?: string;
  duePrecision?: 'none' | 'date' | 'datetime';
}

export interface UserProfile {
  isLoggedIn: boolean;
  name: string;
  email: string;
  avatarInitial: string;
  authProvider: 'google' | 'email' | 'guest';
}

export const DEFAULT_USER: UserProfile = {
  isLoggedIn: false,
  name: '',
  email: '',
  avatarInitial: 'A',
  authProvider: 'guest',
};

export interface AppSettings {
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  defaultProfile: ProfileKey;
  dateOnlyTime: string;
  hasSeenOnboarding: boolean;
  user: UserProfile;
  notificationsSoundEnabled?: boolean;
  notificationsVibrationEnabled?: boolean;
  persistentFollowupsEnabled?: boolean;
  lockScreenPrivacy?: boolean;
  quickCaptureAnywhereEnabled?: boolean;
  floatingButtonVisible?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  defaultProfile: 'Standard',
  dateOnlyTime: '09:00',
  hasSeenOnboarding: false,
  user: DEFAULT_USER,
  notificationsSoundEnabled: true,
  notificationsVibrationEnabled: true,
  persistentFollowupsEnabled: true,
  lockScreenPrivacy: false,
  quickCaptureAnywhereEnabled: false,
  floatingButtonVisible: true,
};

export const PROFILE_DESCRIPTIONS: Record<ProfileKey, string> = {
  Simple: 'At the deadline',
  Standard: '1 day before · 1 hour before · Due',
  Important: '1 day · 4 hours · 15 minutes · Due',
  Persistent: 'Standard + 2 follow-ups (+15m, +60m)',
};
