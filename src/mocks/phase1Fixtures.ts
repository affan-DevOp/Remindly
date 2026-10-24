export interface TaskSourceFixture {
  id: string;
  sourceAppLabel: string;
  sourceAppPackage?: string;
  sourceUrl?: string;
  sourceExcerpt: string;
  senderLabel?: string;
  subject?: string;
}

export interface ReminderStageFixture {
  id: string;
  offsetMinutes: number;
  stageKind: 'heads_up' | 'prep' | 'urgent' | 'deadline' | 'persistent_follow_up';
  stageLabel: string;
  status: 'pending' | 'scheduled' | 'skipped' | 'completed' | 'cancelled';
  triggerAtUtc: string;
}

export interface TaskFixture {
  id: string;
  title: string;
  notes?: string;
  status: 'inbox' | 'scheduled' | 'completed' | 'archived';
  priority: 'normal' | 'important';
  duePrecision: 'none' | 'date' | 'datetime';
  dueAtUtc?: string;
  dueLocalDate?: string;
  dueLocalTime?: string;
  dueTimezone: string;
  reminderProfileId: 'builtin_simple' | 'builtin_standard' | 'builtin_important' | 'builtin_persistent';
  source?: TaskSourceFixture;
  occurrences: ReminderStageFixture[];
  createdAtUtc: string;
  completedAtUtc?: string;
}

export interface ProfileFixture {
  id: string;
  name: string;
  description: string;
  stages: {
    offsetMinutes: number;
    label: string;
    stageKind: 'heads_up' | 'prep' | 'urgent' | 'deadline' | 'persistent_follow_up';
  }[];
}

export const BUILTIN_PROFILES: ProfileFixture[] = [
  {
    id: 'builtin_simple',
    name: 'Simple',
    description: 'Alert once right at the deadline (0m)',
    stages: [{ offsetMinutes: 0, label: 'Due', stageKind: 'deadline' }],
  },
  {
    id: 'builtin_standard',
    name: 'Standard (Default)',
    description: '24 hours before, 1 hour before, at the due time',
    stages: [
      { offsetMinutes: -1440, label: '-24h', stageKind: 'heads_up' },
      { offsetMinutes: -60, label: '-1h', stageKind: 'prep' },
      { offsetMinutes: 0, label: 'Due', stageKind: 'deadline' },
    ],
  },
  {
    id: 'builtin_important',
    name: 'Important',
    description: '24h, 4h, and 15m escalations plus deadline alert',
    stages: [
      { offsetMinutes: -1440, label: '-24h', stageKind: 'heads_up' },
      { offsetMinutes: -240, label: '-4h', stageKind: 'prep' },
      { offsetMinutes: -15, label: '-15m', stageKind: 'urgent' },
      { offsetMinutes: 0, label: 'Due', stageKind: 'deadline' },
    ],
  },
  {
    id: 'builtin_persistent',
    name: 'Persistent',
    description: 'Standard plus 3 repeated follow-ups (+15m, +30m, +60m)',
    stages: [
      { offsetMinutes: -1440, label: '-24h', stageKind: 'heads_up' },
      { offsetMinutes: -60, label: '-1h', stageKind: 'prep' },
      { offsetMinutes: 0, label: 'Due', stageKind: 'deadline' },
      { offsetMinutes: 15, label: '+15m (1/3)', stageKind: 'persistent_follow_up' },
      { offsetMinutes: 30, label: '+30m (2/3)', stageKind: 'persistent_follow_up' },
      { offsetMinutes: 60, label: '+60m (3/3)', stageKind: 'persistent_follow_up' },
    ],
  },
];

export const POPULATED_TASKS: TaskFixture[] = [
  {
    id: 'task_overdue_1',
    title: 'Review revised consulting agreement',
    notes: 'Check indemnity clause and signature blocks.',
    status: 'scheduled',
    priority: 'important',
    duePrecision: 'datetime',
    dueAtUtc: '2026-10-24T00:30:00.000Z',
    dueLocalDate: '2026-10-24',
    dueLocalTime: '06:00',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_important',
    source: {
      id: 'src_1',
      sourceAppLabel: 'WhatsApp',
      sourceAppPackage: 'com.whatsapp',
      senderLabel: 'Aarav Mehta',
      sourceExcerpt: '[23/10/26, 8:40 PM] Aarav: Please make sure the revised agreement is reviewed before 6 AM tomorrow morning.',
    },
    occurrences: [
      { id: 'occ_1', offsetMinutes: -1440, stageKind: 'heads_up', stageLabel: '-24h', status: 'skipped', triggerAtUtc: '2026-10-23T00:30:00.000Z' },
      { id: 'occ_2', offsetMinutes: -240, stageKind: 'prep', stageLabel: '-4h', status: 'completed', triggerAtUtc: '2026-10-23T20:30:00.000Z' },
      { id: 'occ_3', offsetMinutes: -15, stageKind: 'urgent', stageLabel: '-15m', status: 'completed', triggerAtUtc: '2026-10-24T00:15:00.000Z' },
      { id: 'occ_4', offsetMinutes: 0, stageKind: 'deadline', stageLabel: 'Due', status: 'scheduled', triggerAtUtc: '2026-10-24T00:30:00.000Z' },
    ],
    createdAtUtc: '2026-10-23T15:10:00.000Z',
  },
  {
    id: 'task_next_up_1',
    title: 'Follow up with design team on prototype specs',
    status: 'scheduled',
    priority: 'important',
    duePrecision: 'datetime',
    dueAtUtc: '2026-10-24T03:00:00.000Z',
    dueLocalDate: '2026-10-24',
    dueLocalTime: '08:30',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_standard',
    source: {
      id: 'src_2',
      sourceAppLabel: 'Slack',
      sourceExcerpt: 'Elena: Can we get the finalized Figma component tokens before 8:30 AM?',
      sourceUrl: 'https://figma.com/file/mobbin-demo-specs',
    },
    occurrences: [
      { id: 'occ_5', offsetMinutes: -60, stageKind: 'prep', stageLabel: '-1h', status: 'scheduled', triggerAtUtc: '2026-10-24T02:00:00.000Z' },
      { id: 'occ_6', offsetMinutes: 0, stageKind: 'deadline', stageLabel: 'Due', status: 'pending', triggerAtUtc: '2026-10-24T03:00:00.000Z' },
    ],
    createdAtUtc: '2026-10-23T18:00:00.000Z',
  },
  {
    id: 'task_today_afternoon',
    title: 'Submit quarterly budget reconciliation report',
    status: 'scheduled',
    priority: 'normal',
    duePrecision: 'datetime',
    dueAtUtc: '2026-10-24T09:30:00.000Z',
    dueLocalDate: '2026-10-24',
    dueLocalTime: '15:00',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_standard',
    source: {
      id: 'src_3',
      sourceAppLabel: 'Gmail',
      senderLabel: 'Finance Operations',
      subject: 'Action Required: Q3 Ledger close today by 3 PM',
      sourceExcerpt: 'Finance Ops: All departmental expense allocations must be approved before 3:00 PM IST today.',
      sourceUrl: 'https://finance.internal/q3-close',
    },
    occurrences: [
      { id: 'occ_7', offsetMinutes: -60, stageKind: 'prep', stageLabel: '-1h', status: 'scheduled', triggerAtUtc: '2026-10-24T08:30:00.000Z' },
      { id: 'occ_8', offsetMinutes: 0, stageKind: 'deadline', stageLabel: 'Due', status: 'pending', triggerAtUtc: '2026-10-24T09:30:00.000Z' },
    ],
    createdAtUtc: '2026-10-23T12:00:00.000Z',
  },
  {
    id: 'task_completed_today',
    title: 'Morning standup sync with mobile engineers',
    status: 'completed',
    priority: 'normal',
    duePrecision: 'datetime',
    dueAtUtc: '2026-10-24T04:30:00.000Z',
    dueLocalDate: '2026-10-24',
    dueLocalTime: '10:00',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_simple',
    occurrences: [
      { id: 'occ_9', offsetMinutes: 0, stageKind: 'deadline', stageLabel: 'Due', status: 'completed', triggerAtUtc: '2026-10-24T04:30:00.000Z' },
    ],
    createdAtUtc: '2026-10-23T17:00:00.000Z',
    completedAtUtc: '2026-10-24T04:35:00.000Z',
  },
  {
    id: 'task_upcoming_tomorrow',
    title: 'Finalize presentation slides for leadership review',
    status: 'scheduled',
    priority: 'important',
    duePrecision: 'date',
    dueLocalDate: '2026-10-25',
    dueLocalTime: '09:00',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_standard',
    source: {
      id: 'src_4',
      sourceAppLabel: 'Slack',
      sourceExcerpt: 'VP Product: Sunday 9am is the cut-off for the executive slide deck.',
    },
    occurrences: [
      { id: 'occ_10', offsetMinutes: -1440, stageKind: 'heads_up', stageLabel: '-24h', status: 'scheduled', triggerAtUtc: '2026-10-24T03:30:00.000Z' },
      { id: 'occ_11', offsetMinutes: -60, stageKind: 'prep', stageLabel: '-1h', status: 'pending', triggerAtUtc: '2026-10-25T02:30:00.000Z' },
      { id: 'occ_12', offsetMinutes: 0, stageKind: 'deadline', stageLabel: 'Due', status: 'pending', triggerAtUtc: '2026-10-25T03:30:00.000Z' },
    ],
    createdAtUtc: '2026-10-23T19:00:00.000Z',
  },
  {
    id: 'task_upcoming_later',
    title: 'Renew domain registration and cloud certificates',
    status: 'scheduled',
    priority: 'normal',
    duePrecision: 'datetime',
    dueAtUtc: '2026-10-28T06:30:00.000Z',
    dueLocalDate: '2026-10-28',
    dueLocalTime: '12:00',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_standard',
    source: {
      id: 'src_5',
      sourceAppLabel: 'Chrome',
      sourceExcerpt: 'Cloudflare Alert: TLS certificate expires in 5 days for api.remindly.dev',
      sourceUrl: 'https://dash.cloudflare.com/ssl-certs',
    },
    occurrences: [
      { id: 'occ_13', offsetMinutes: -1440, stageKind: 'heads_up', stageLabel: '-24h', status: 'pending', triggerAtUtc: '2026-10-27T06:30:00.000Z' },
      { id: 'occ_14', offsetMinutes: 0, stageKind: 'deadline', stageLabel: 'Due', status: 'pending', triggerAtUtc: '2026-10-28T06:30:00.000Z' },
    ],
    createdAtUtc: '2026-10-23T20:00:00.000Z',
  },
  {
    id: 'task_inbox_1',
    title: 'Need to get back to Maya regarding venue lease',
    status: 'inbox',
    priority: 'normal',
    duePrecision: 'none',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_standard',
    source: {
      id: 'src_6',
      sourceAppLabel: 'WhatsApp',
      senderLabel: 'Maya Patel',
      sourceExcerpt: 'Hey, let me know if you had a chance to speak with the landlord. We have another interested party asking for the lease.',
    },
    occurrences: [],
    createdAtUtc: '2026-10-23T21:15:00.000Z',
  },
  {
    id: 'task_inbox_2',
    title: 'Review flight booking options for Bangalore conf',
    status: 'inbox',
    priority: 'normal',
    duePrecision: 'none',
    dueTimezone: 'Asia/Kolkata',
    reminderProfileId: 'builtin_standard',
    source: {
      id: 'src_7',
      sourceAppLabel: 'Gmail',
      senderLabel: 'Kiran Rao',
      subject: 'Fwd: Flight prices rising for next weekend',
      sourceExcerpt: 'Sharing the fare chart. Take a look when you get a second.',
      sourceUrl: 'https://makemytrip.com/flights/blr',
    },
    occurrences: [],
    createdAtUtc: '2026-10-23T21:45:00.000Z',
  },
];

export const AMBIGUOUS_CAPTURE_SAMPLE = {
  rawText: 'Fwd from Rahul: The committee agreed to meet either Friday at 4 PM or Monday morning at 10 AM. Please confirm which one works for you.',
  detectedCandidates: [
    { label: 'Fri, 30 Oct • 16:00', phrase: 'Friday at 4 PM', utc: '2026-10-30T10:30:00.000Z' },
    { label: 'Mon, 2 Nov • 10:00', phrase: 'Monday morning at 10 AM', utc: '2026-11-02T04:30:00.000Z' },
  ],
  sourceAppLabel: 'WhatsApp',
  senderLabel: 'Rahul Gupta',
};
