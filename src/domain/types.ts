export type TaskStatus = 'inbox' | 'scheduled' | 'completed' | 'archived';
export type TaskPriority = 'normal' | 'important';
export type DuePrecision = 'none' | 'date' | 'datetime';
export type StageKind = 'heads_up' | 'prep' | 'urgent' | 'deadline' | 'persistent_follow_up';
export type OccurrenceStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'skipped' | 'failed';

export interface TaskRecord {
  user_id?: string;
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_precision: DuePrecision;
  due_at_utc: string | null;
  due_local_date: string | null;
  due_local_time: string | null;
  due_timezone: string;
  reminder_profile_id: string | null;
  created_at_utc: string;
  updated_at_utc: string;
  completed_at_utc: string | null;
  archived_at_utc: string | null;
}

export interface TaskSourceRecord {
  id: string;
  task_id: string;
  source_app_label: string | null;
  source_app_package: string | null;
  source_url: string | null;
  source_excerpt: string | null;
  sender_label: string | null;
  subject: string | null;
  created_at_utc: string;
}

export interface ReminderProfileRecord {
  id: string;
  name: string;
  description: string;
  is_builtin: number;
  repeat_interval_minutes: number | null;
  max_repeats: number;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface ProfileStageRecord {
  id: string;
  profile_id: string;
  sort_order: number;
  offset_minutes: number;
  stage_kind: StageKind;
  enabled: number;
}

export interface ReminderOccurrenceRecord {
  id: string;
  task_id: string;
  profile_stage_id: string | null;
  trigger_at_utc: string;
  stage_label: string;
  status: OccurrenceStatus;
  os_notification_id: string | null;
  schedule_attempt_count: number;
  last_error: string | null;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface AppSettingRecord {
  key: string;
  value: string;
}

export interface BuiltinProfileDefinition {
  id: string;
  name: string;
  description: string;
  repeat_interval_minutes: number | null;
  max_repeats: number;
  stages: {
    sort_order: number;
    offset_minutes: number;
    stage_kind: StageKind;
    label: string;
  }[];
}

export const BUILTIN_PROFILES: BuiltinProfileDefinition[] = [
  {
    id: 'builtin_simple',
    name: 'Simple',
    description: 'At the due time (0m)',
    repeat_interval_minutes: null,
    max_repeats: 0,
    stages: [
      { sort_order: 1, offset_minutes: 0, stage_kind: 'deadline', label: 'Due' },
    ],
  },
  {
    id: 'builtin_standard',
    name: 'Standard',
    description: '24h before (-1440m), 1h before (-60m), at due time (0m)',
    repeat_interval_minutes: null,
    max_repeats: 0,
    stages: [
      { sort_order: 1, offset_minutes: -1440, stage_kind: 'heads_up', label: '-24h' },
      { sort_order: 2, offset_minutes: -60, stage_kind: 'prep', label: '-1h' },
      { sort_order: 3, offset_minutes: 0, stage_kind: 'deadline', label: 'Due' },
    ],
  },
  {
    id: 'builtin_important',
    name: 'Important',
    description: '24h before (-1440m), 4h before (-240m), 15m before (-15m), at due time (0m)',
    repeat_interval_minutes: null,
    max_repeats: 0,
    stages: [
      { sort_order: 1, offset_minutes: -1440, stage_kind: 'heads_up', label: '-24h' },
      { sort_order: 2, offset_minutes: -240, stage_kind: 'prep', label: '-4h' },
      { sort_order: 3, offset_minutes: -15, stage_kind: 'urgent', label: '-15m' },
      { sort_order: 4, offset_minutes: 0, stage_kind: 'deadline', label: 'Due' },
    ],
  },
  {
    id: 'builtin_persistent',
    name: 'Persistent',
    description: 'Standard + 2 follow-ups (+15m, +60m)',
    repeat_interval_minutes: 15,
    max_repeats: 2,
    stages: [
      { sort_order: 1, offset_minutes: -1440, stage_kind: 'heads_up', label: '-24h' },
      { sort_order: 2, offset_minutes: -60, stage_kind: 'prep', label: '-1h' },
      { sort_order: 3, offset_minutes: 0, stage_kind: 'deadline', label: 'Due' },
      { sort_order: 4, offset_minutes: 15, stage_kind: 'persistent_follow_up', label: '+15m' },
      { sort_order: 5, offset_minutes: 60, stage_kind: 'persistent_follow_up', label: '+60m' },
    ],
  },
];
