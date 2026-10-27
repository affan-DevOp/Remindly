import { formatTimeLabel } from '../utils/taskScheduling';
import { getSqliteDatabase, ISqliteDatabase, MemorySqliteDatabase } from '../db/sqliteDatabase';
import { runMigrations } from '../db/migrations';
import {
  TaskRecord,
  TaskSourceRecord,
  ReminderProfileRecord,
  ProfileStageRecord,
  ReminderOccurrenceRecord,
  AppSettingRecord,
  BUILTIN_PROFILES,
} from '../domain/types';
import { materializeOccurrences } from '../domain/occurrenceMaterializer';
import { OmniTask, AppSettings, DEFAULT_SETTINGS, ProfileKey, TaskSource, UserProfile, DEFAULT_USER } from '../types/task';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}


function formatDateLabel(localDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return localDate;
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayLabel = formatLocalDate(today);
  if (localDate === todayLabel) return 'Today';
  if (localDate === formatLocalDate(tomorrow)) return 'Tomorrow';
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export const INITIAL_SEED_TASKS: OmniTask[] = [
  {
    id: 'task-101',
    title: 'Review supplier invoice #4829',
    timeLabel: '9:00 AM',
    dateLabel: 'Today',
    status: 'overdue',
    source: 'Gmail',
    excerpt: 'Invoice #4829 from CloudScale Supplies is ready for payment approval before 9:00 AM.',
    sourceUrl: 'https://mail.google.com/mail/u/0/#inbox/FMfcgz',
    important: true,
    profile: 'Important',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'task-102',
    title: 'Finalize mobile design tokens',
    timeLabel: '11:30 AM',
    dateLabel: 'Today',
    status: 'upcoming',
    source: 'Slack',
    excerpt: 'design-system: Can we lock the dark mode contrast tokens by 11:30 AM today?',
    sourceUrl: 'https://slack.com/app_redirect?channel=C04289',
    important: true,
    profile: 'Standard',
    createdAt: Date.now() - 1000 * 60 * 95,
  },
  {
    id: 'task-103',
    title: 'Call Dr. Sharma for lab report follow-up',
    timeLabel: '1:15 PM',
    dateLabel: 'Today',
    status: 'upcoming',
    source: 'Notes',
    excerpt: 'Follow up on lipid panel and prescription refill.',
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

export class TaskRepository {
  private db: ISqliteDatabase | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private currentUserId: string = 'local_guest';

  public setCurrentUserId(userId: string): void {
    this.currentUserId = userId || 'local_guest';
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    const initPromise = (async () => {
      try {
        this.db = await getSqliteDatabase();
        await runMigrations(this.db);
      } catch (primaryErr) {
        console.warn('[TaskRepository] Primary storage initialization failed, falling back to memory database:', primaryErr);
        const memDb = new MemorySqliteDatabase();
        await memDb.initPersistence();
        this.db = memDb;
        await runMigrations(this.db);
      }

      this.initialized = true;

      try {
        const seeded = await this.db.getFirst<AppSettingRecord>('SELECT * FROM app_settings WHERE key = ?;', ['seed_tasks_initialized']);
        const countRow = await this.db.getFirst<{ count: number }>('SELECT COUNT(*) as count FROM tasks;');
        if (!seeded && (!countRow || countRow.count === 0)) {
          for (const t of INITIAL_SEED_TASKS) {
            await this.saveOmniTask({ ...t, userId: 'local_guest' }, 'local_guest');
          }
        }
        await this.updateSetting('seed_tasks_initialized', true);
      } catch (seedErr) {
        console.warn('[TaskRepository] Could not seed default tasks:', seedErr);
      }
    })();

    this.initPromise = initPromise;
    try {
      await initPromise;
    } catch (error) {
      this.initPromise = null;
      this.db = null;
      this.initialized = false;
      throw error;
    }
  }

  public async initFallback(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    const memDb = new MemorySqliteDatabase();
    await memDb.initPersistence();
    this.db = memDb;
    await runMigrations(this.db);
    this.initialized = true;

    try {
      const seeded = await this.db.getFirst<AppSettingRecord>('SELECT * FROM app_settings WHERE key = ?;', ['seed_tasks_initialized']);
      const countRow = await this.db.getFirst<{ count: number }>('SELECT COUNT(*) as count FROM tasks;');
      if (!seeded && (!countRow || countRow.count === 0)) {
        for (const t of INITIAL_SEED_TASKS) {
          await this.saveOmniTask({ ...t, userId: 'local_guest' }, 'local_guest');
        }
      }
      await this.updateSetting('seed_tasks_initialized', true);
    } catch (e) {}
  }

  private getDb(): ISqliteDatabase {
    if (!this.db) {
      console.warn('[TaskRepository] getDb called before initialization, creating emergency in-memory database');
      const memDb = new MemorySqliteDatabase();
      this.db = memDb;
    }
    return this.db;
  }

  // --- Domain Level Operations ---

  public async getDomainTask(id: string): Promise<TaskRecord | null> {
    await this.init();
    return this.getDb().getFirst<TaskRecord>('SELECT * FROM tasks WHERE id = ?;', [id]);
  }

  public async getDomainTasks(userId?: string): Promise<TaskRecord[]> {
    await this.init();
    if (userId) {
      return this.getDb().getAll<TaskRecord>('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at_utc DESC;', [userId]);
    }
    return this.getDb().getAll<TaskRecord>('SELECT * FROM tasks ORDER BY created_at_utc DESC;');
  }

  public async saveDomainTask(task: TaskRecord, source?: Partial<TaskSourceRecord> | null, now: Date = new Date()): Promise<void> {
    await this.init();
    const profileId = task.reminder_profile_id || 'builtin_standard';
    const db = this.getDb();

    const userId = task.user_id || this.currentUserId || 'local_guest';

    await db.transaction(async (tx) => {
      // 1. Upsert task with user_id
      await tx.run(
        `INSERT INTO tasks (
          id, user_id, title, notes, status, priority, due_precision,
          due_at_utc, due_local_date, due_local_time, due_timezone,
          reminder_profile_id, created_at_utc, updated_at_utc,
          completed_at_utc, archived_at_utc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          title = excluded.title,
          notes = excluded.notes,
          status = excluded.status,
          priority = excluded.priority,
          due_precision = excluded.due_precision,
          due_at_utc = excluded.due_at_utc,
          due_local_date = excluded.due_local_date,
          due_local_time = excluded.due_local_time,
          due_timezone = excluded.due_timezone,
          reminder_profile_id = excluded.reminder_profile_id,
          updated_at_utc = excluded.updated_at_utc,
          completed_at_utc = excluded.completed_at_utc,
          archived_at_utc = excluded.archived_at_utc;`,
        [
          task.id,
          userId,
          task.title,
          task.notes,
          task.status,
          task.priority,
          task.due_precision,
          task.due_at_utc,
          task.due_local_date,
          task.due_local_time,
          task.due_timezone,
          profileId,
          task.created_at_utc,
          task.updated_at_utc,
          task.completed_at_utc,
          task.archived_at_utc,
        ]
      );

      // 2. Upsert source if present
      if (source) {
        const sourceId = source.id || `source-${task.id}`;
        await tx.run(
          `INSERT OR REPLACE INTO task_sources (
            id, task_id, source_app_label, source_app_package,
            source_url, source_excerpt, sender_label, subject, created_at_utc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            sourceId,
            task.id,
            source.source_app_label || null,
            source.source_app_package || null,
            source.source_url || null,
            source.source_excerpt || null,
            source.sender_label || null,
            source.subject || null,
            source.created_at_utc || task.created_at_utc,
          ]
        );
      }

      // 3. Atomically reconcile reminder occurrences
      await tx.run(
        "UPDATE reminder_occurrences SET status = 'cancelled' WHERE task_id = ? AND status IN ('pending', 'scheduled');",
        [task.id]
      );

      // If scheduled, materialize occurrences
      if (task.status === 'scheduled' && task.due_at_utc) {
        const stages = await tx.getAll<ProfileStageRecord>(
          'SELECT * FROM profile_stages WHERE profile_id = ? ORDER BY sort_order ASC;',
          [profileId]
        );
        const profile = await tx.getFirst<ReminderProfileRecord>(
          'SELECT * FROM reminder_profiles WHERE id = ?;',
          [profileId]
        );

        const newOccurrences = materializeOccurrences(task, stages, profile, now);
        for (const occ of newOccurrences) {
          await tx.run(
            `INSERT INTO reminder_occurrences (
              id, task_id, profile_stage_id, trigger_at_utc,
              stage_label, status, os_notification_id,
              schedule_attempt_count, last_error, created_at_utc, updated_at_utc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              profile_stage_id = excluded.profile_stage_id,
              trigger_at_utc = excluded.trigger_at_utc,
              stage_label = excluded.stage_label,
              status = excluded.status,
              os_notification_id = NULL,
              schedule_attempt_count = 0,
              last_error = NULL,
              updated_at_utc = excluded.updated_at_utc;`,
            [
              occ.id,
              occ.task_id,
              occ.profile_stage_id,
              occ.trigger_at_utc,
              occ.stage_label,
              occ.status,
              occ.os_notification_id,
              occ.schedule_attempt_count,
              occ.last_error,
              occ.created_at_utc,
              occ.updated_at_utc,
            ]
          );
        }
      }
    });
  }

  public async getOccurrencesForTask(taskId: string): Promise<ReminderOccurrenceRecord[]> {
    await this.init();
    return this.getDb().getAll<ReminderOccurrenceRecord>(
      'SELECT * FROM reminder_occurrences WHERE task_id = ? ORDER BY trigger_at_utc ASC;',
      [taskId]
    );
  }

  public async getPendingOccurrences(now: Date = new Date()): Promise<ReminderOccurrenceRecord[]> {
    await this.init();
    return this.getDb().getAll<ReminderOccurrenceRecord>(
      "SELECT * FROM reminder_occurrences WHERE status IN ('pending', 'scheduled') AND trigger_at_utc > ? ORDER BY trigger_at_utc ASC;",
      [now.toISOString()]
    );
  }

  public async getAllOccurrences(): Promise<ReminderOccurrenceRecord[]> {
    await this.init();
    return this.getDb().getAll<ReminderOccurrenceRecord>('SELECT * FROM reminder_occurrences;');
  }

  public async updateOccurrenceStatus(
    occurrenceId: string,
    status: ReminderOccurrenceRecord['status'],
    osNotificationId?: string
  ): Promise<void> {
    await this.init();
    await this.getDb().run(
      'UPDATE reminder_occurrences SET status = ?, os_notification_id = ?, updated_at_utc = ? WHERE id = ?;',
      [status, osNotificationId || null, new Date().toISOString(), occurrenceId]
    );
  }

  // --- OmniTask Compatibility Bridge for UI Screens ---

  public async getAllTasks(userId?: string): Promise<OmniTask[]> {
    await this.init();
    const effectiveUserId = userId || this.currentUserId || 'local_guest';
    const db = this.getDb();
    const tasks = (await db.getAll<TaskRecord>("SELECT * FROM tasks WHERE status != 'archived' AND user_id = ? ORDER BY created_at_utc DESC;", [effectiveUserId]))
      .filter((task) => task.status !== 'archived')
      .sort((a, b) => Date.parse(b.created_at_utc) - Date.parse(a.created_at_utc));
    const sources = await db.getAll<TaskSourceRecord>('SELECT * FROM task_sources;');
    const snoozes = (await this.getPendingOccurrences()).filter((occurrence) => occurrence.stage_label.startsWith('Snooze'));
    const snoozeMap = new Map(snoozes.map((occurrence) => [occurrence.task_id, occurrence]));

        const sourceMap = new Map<string, TaskSourceRecord>();
    for (const s of sources) {
      sourceMap.set(s.task_id, s);
    }

    return tasks.map((t) => {
      const src = sourceMap.get(t.id);
      let status: OmniTask['status'] = 'upcoming';
      if (t.status === 'completed') status = 'done';
      else if (t.status === 'inbox') status = 'inbox';
      else if (t.status === 'scheduled') {
        if (t.due_at_utc && Date.parse(t.due_at_utc) < Date.now()) {
          status = 'overdue';
        } else {
          status = 'upcoming';
        }
      }

      let profileKey: ProfileKey = 'Standard';
      if (t.reminder_profile_id?.includes('simple')) profileKey = 'Simple';
      else if (t.reminder_profile_id?.includes('important')) profileKey = 'Important';
      else if (t.reminder_profile_id?.includes('persistent')) profileKey = 'Persistent';

      let sourceKey: TaskSource = 'Manual';
      const label = (src?.source_app_label || '').toLowerCase();
      if (label.includes('whatsapp')) sourceKey = 'WhatsApp';
      else if (label.includes('outlook')) sourceKey = 'Outlook';
      else if (label.includes('gmail')) sourceKey = 'Gmail';
      else if (label.includes('slack')) sourceKey = 'Slack';
      else if (label.includes('telegram')) sourceKey = 'Telegram';
      else if (label.includes('note')) sourceKey = 'Notes';
      else if (label.includes('web') || label.includes('chrome') || label.includes('browser')) sourceKey = 'Web';
      else if (label.includes('other')) sourceKey = 'Other';

      const localDate = t.due_local_date || undefined;
      const localTime = t.due_local_time || undefined;
      const snooze = snoozeMap.get(t.id);
      const snoozeMinutes = snooze ? Math.max(1, Math.ceil((Date.parse(snooze.trigger_at_utc) - Date.now()) / 60000)) : 0;
      if (snooze && t.status === 'scheduled') status = 'upcoming';
      return {
        id: t.id,
        userId: t.user_id,
        title: t.title,
        timeLabel: snooze ? (snoozeMinutes === 60 ? 'In 1 hour' : `In ${snoozeMinutes} min`) : formatTimeLabel(localTime),
        dateLabel: localDate ? formatDateLabel(localDate) : 'Inbox',
        status,
        source: sourceKey,
        excerpt: src?.source_excerpt || t.notes || '',
        sourceUrl: src?.source_url || undefined,
        sourceSubject: src?.subject || undefined,
        sourceSender: src?.sender_label || undefined,
        important: t.priority === 'important',
        profile: profileKey,
        createdAt: Date.parse(t.created_at_utc) || Date.now(),
        completedAt: t.completed_at_utc ? Date.parse(t.completed_at_utc) : undefined,
        notes: t.notes || undefined,
        dueAtUtc: t.due_at_utc || undefined,
        dueLocalDate: localDate,
        dueLocalTime: localTime,
        dueTimezone: t.due_timezone,
        duePrecision: t.due_precision,
      };
    });
  }

  public async saveOmniTask(task: OmniTask, userId?: string): Promise<OmniTask> {
    await this.init();
    const effectiveUserId = task.userId || userId || this.currentUserId || 'local_guest';
    task.userId = effectiveUserId;
    const nowIso = new Date().toISOString();
    const createdIso = new Date(task.createdAt || Date.now()).toISOString();

    let domainStatus: TaskRecord['status'] = 'scheduled';
    if (task.status === 'done') domainStatus = 'completed';
    else if (task.status === 'inbox') domainStatus = 'inbox';

    let profileId = 'builtin_standard';
    if (task.profile === 'Simple') profileId = 'builtin_simple';
    else if (task.profile === 'Important') profileId = 'builtin_important';
    else if (task.profile === 'Persistent') profileId = 'builtin_persistent';

    let dueUtc = task.dueAtUtc && domainStatus !== 'inbox' ? task.dueAtUtc : null;
    let duePrecision: TaskRecord['due_precision'] = dueUtc
      ? (task.duePrecision === 'date' ? 'date' : 'datetime')
      : 'none';

    if (domainStatus !== 'inbox' && !dueUtc) {
      duePrecision = 'datetime';
      if (task.status === 'overdue') {
        dueUtc = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      } else {
        dueUtc = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }
    }
    let dueDate = task.dueLocalDate;
    if (!dueDate && domainStatus !== 'inbox') {
      if (task.dateLabel === 'Today' || task.status === 'overdue') {
        dueDate = formatLocalDate(new Date());
      } else if (task.dateLabel === 'Tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = formatLocalDate(tomorrow);
      } else if (dueUtc) {
        dueDate = formatLocalDate(new Date(dueUtc));
      }
    }

    let dueTime = task.dueLocalTime;
    if (!dueTime && domainStatus !== 'inbox') {
      if (task.timeLabel && task.timeLabel !== 'No deadline') {
        const match = task.timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = match[2];
          const period = (match[3] || '').toUpperCase();
          if (period === 'PM' && h < 12) h += 12;
          else if (period === 'AM' && h === 12) h = 0;
          dueTime = `${String(h).padStart(2, '0')}:${m}`;
        }
      }
      if (!dueTime && dueUtc) {
        dueTime = formatLocalTime(new Date(dueUtc));
      }
    }

    const domainTask: TaskRecord = {
      id: task.id,
      user_id: effectiveUserId,
      title: task.title,
      notes: task.notes || null,
      status: domainStatus,
      priority: task.important ? 'important' : 'normal',
      due_precision: duePrecision,
      due_at_utc: dueUtc,
      due_local_date: dueDate || null,
      due_local_time: dueTime || null,
      due_timezone: task.dueTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      reminder_profile_id: profileId,
      created_at_utc: createdIso,
      updated_at_utc: nowIso,
      completed_at_utc: task.completedAt ? new Date(task.completedAt).toISOString() : null,
      archived_at_utc: null,
    };

    const domainSource: TaskSourceRecord = {
      id: `source-${task.id}`,
      task_id: task.id,
      source_app_label: task.source,
      source_app_package: null,
      source_url: task.sourceUrl || null,
      source_excerpt: task.excerpt || null,
      sender_label: task.sourceSender || null,
      subject: task.sourceSubject || null,
      created_at_utc: createdIso,
    };

    await this.saveDomainTask(domainTask, domainSource);
    return task;
  }

  public async saveTask(task: OmniTask, userId?: string): Promise<OmniTask> {
    return this.saveOmniTask(task, userId);
  }

  public async completeTask(taskId: string, now: Date = new Date()): Promise<void> {
    await this.init();
    const nowIso = now.toISOString();

    await this.getDb().transaction(async (tx) => {
      await tx.run(
        "UPDATE tasks SET status = 'completed', completed_at_utc = ?, updated_at_utc = ? WHERE id = ?;",
        [nowIso, nowIso, taskId]
      );
      await tx.run(
        "UPDATE reminder_occurrences SET status = 'cancelled', updated_at_utc = ? WHERE task_id = ? AND status IN ('pending', 'scheduled');",
        [nowIso, taskId]
      );
    });
  }

  public async archiveTask(taskId: string, now: Date = new Date()): Promise<void> {
    await this.init();
    const nowIso = now.toISOString();

    await this.getDb().transaction(async (tx) => {
      await tx.run(
        "UPDATE tasks SET status = 'archived', archived_at_utc = ?, updated_at_utc = ? WHERE id = ?;",
        [nowIso, nowIso, taskId]
      );
      await tx.run(
        "UPDATE reminder_occurrences SET status = 'cancelled', updated_at_utc = ? WHERE task_id = ? AND status IN ('pending', 'scheduled');",
        [nowIso, taskId]
      );
    });
  }

  public async deleteTask(taskId: string): Promise<void> {
    await this.init();
    await this.getDb().run('DELETE FROM tasks WHERE id = ?;', [taskId]);
  }

  public async snoozeTask(taskId: string, minutes: number = 10, now: Date = new Date()): Promise<void> {
    await this.init();
    let task = await this.getDomainTask(taskId);
    if (!task) return;

    // Preserve original deadline (due_at_utc and due_local_date)!
    const snoozeTriggerMs = now.getTime() + minutes * 60 * 1000;
    const snoozeTriggerUtc = new Date(snoozeTriggerMs).toISOString();
    if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('Invalid snooze duration');
    if (task.status === 'archived') throw new Error('Cannot snooze an archived task');
    if (task.status === 'inbox' || task.status === 'completed') {
      await this.saveDomainTask({
        ...task, status: 'scheduled', completed_at_utc: null,
        due_at_utc: task.due_at_utc || snoozeTriggerUtc,
        due_local_date: task.due_local_date || formatLocalDate(new Date(snoozeTriggerUtc)),
        due_local_time: task.due_local_time || formatLocalTime(new Date(snoozeTriggerUtc)),
        due_precision: task.due_precision === 'none' ? 'datetime' : task.due_precision,
        updated_at_utc: now.toISOString(),
      }, null, now);
      task = (await this.getDomainTask(taskId))!;
    }

    const db = this.getDb();
    await db.transaction(async (tx) => {
      // Keep the deadline's canonical local time intact when snoozing.
      await tx.run(
        'UPDATE tasks SET due_local_time = ?, updated_at_utc = ? WHERE id = ?;',
        [task.due_local_time, now.toISOString(), task.id]
      );

      // 2. Cancel previous pending snooze occurrences for this task (avoiding duplicate snooze timers)
      await tx.run(
        "UPDATE reminder_occurrences SET status = 'cancelled' WHERE task_id = ? AND stage_label LIKE 'Snooze%' AND status IN ('pending', 'scheduled');",
        [task.id]
      );

      // 3. Anti-collision: Suppress regular profile occurrences that would fire within 5 minutes of the snooze alert
      const existing = await tx.getAll<ReminderOccurrenceRecord>(
        "SELECT * FROM reminder_occurrences WHERE task_id = ? AND status IN ('pending', 'scheduled');",
        [task.id]
      );
      for (const occ of existing) {
        const occTimeMs = Date.parse(occ.trigger_at_utc);
        if (!isNaN(occTimeMs) && Math.abs(occTimeMs - snoozeTriggerMs) < 5 * 60 * 1000) {
          await tx.run("UPDATE reminder_occurrences SET status = 'skipped' WHERE id = ?;", [occ.id]);
        }
      }

      // 4. Insert dedicated snooze occurrence
      const snoozeOccId = `occ-${task.id}-snooze-${snoozeTriggerMs}`;
      await tx.run(
        `INSERT INTO reminder_occurrences (
          id, task_id, profile_stage_id, trigger_at_utc, stage_label,
          status, os_notification_id, schedule_attempt_count, last_error,
          created_at_utc, updated_at_utc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); `,
        [
          snoozeOccId,
          task.id,
          null,
          snoozeTriggerUtc,
          `Snooze (+${minutes}m)`,
          'pending',
          null,
          0,
          null,
          now.toISOString(),
          now.toISOString(),
        ]
      );
    });
  }

  // --- Settings ---

  public async getSettings(): Promise<AppSettings> {
    await this.init();
    const rows = await this.getDb().getAll<AppSettingRecord>('SELECT * FROM app_settings;');
    const settings: AppSettings = { ...DEFAULT_SETTINGS, user: { ...DEFAULT_USER } };

    for (const r of rows) {
      if (r.key === 'quiet_hours_enabled') settings.quietHoursEnabled = r.value === '1' || r.value === 'true';
      if (r.key === 'quiet_hours_start') settings.quietHoursStart = r.value;
      if (r.key === 'quiet_hours_end') settings.quietHoursEnd = r.value;
      if (r.key === 'default_profile_id') {
        if (r.value.includes('simple')) settings.defaultProfile = 'Simple';
        else if (r.value.includes('important')) settings.defaultProfile = 'Important';
        else if (r.value.includes('persistent')) settings.defaultProfile = 'Persistent';
        else settings.defaultProfile = 'Standard';
      }
      if (r.key === 'default_date_only_time') settings.dateOnlyTime = r.value;
      if (r.key === 'has_seen_onboarding') settings.hasSeenOnboarding = r.value === '1';
      if (r.key === 'notifications_sound_enabled') settings.notificationsSoundEnabled = r.value === '1' || r.value === 'true';
      if (r.key === 'notifications_vibration_enabled') settings.notificationsVibrationEnabled = r.value === '1' || r.value === 'true';
      if (r.key === 'persistent_followups_enabled') settings.persistentFollowupsEnabled = r.value === '1' || r.value === 'true';
      if (r.key === 'lock_screen_privacy') settings.lockScreenPrivacy = r.value === '1' || r.value === 'true';
      if (r.key === 'quick_capture_anywhere_enabled') settings.quickCaptureAnywhereEnabled = r.value === '1' || r.value === 'true';
      if (r.key === 'floating_button_visible') settings.floatingButtonVisible = r.value === '1' || r.value === 'true';
      if (r.key === 'user_is_logged_in') settings.user.isLoggedIn = r.value === '1';
      if (r.key === 'user_name') settings.user.name = r.value;
      if (r.key === 'user_email') settings.user.email = r.value;
      if (r.key === 'user_avatar_initial') settings.user.avatarInitial = r.value;
      if (r.key === 'user_auth_provider') settings.user.authProvider = r.value as any;
    }

    return settings;
  }

  public async updateSetting(key: string, value: any): Promise<void> {
    await this.init();
    const strVal = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
    await this.getDb().run(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);',
      [key, strVal]
    );
  }

  public async saveUser(user: UserProfile): Promise<void> {
    await this.init();
    const targetUserId = user.isLoggedIn ? (user.email || 'local_guest') : 'local_guest';
    this.currentUserId = targetUserId;
    await this.updateSetting('user_is_logged_in', user.isLoggedIn ? '1' : '0');
    await this.updateSetting('user_name', user.name);
    await this.updateSetting('user_email', user.email);
    await this.updateSetting('user_avatar_initial', user.avatarInitial);
    await this.updateSetting('user_auth_provider', user.authProvider);
    await this.updateSetting('has_seen_onboarding', '1');

    // Multi-user task preservation: if user signs in and has no tasks, migrate guest tasks
    if (user.isLoggedIn && targetUserId !== 'local_guest') {
      try {
        await this.getDb().run(
          'UPDATE tasks SET user_id = ? WHERE user_id = ? OR user_id IS NULL;',
          [targetUserId, 'local_guest']
        );
      } catch (err) {
        console.warn('[Remindly] Error migrating guest tasks to user:', err);
      }
    }
  }

  public async logoutUser(): Promise<void> {
    await this.init();
    this.currentUserId = 'local_guest';
    await this.updateSetting('user_is_logged_in', '0');
    await this.updateSetting('user_name', '');
    await this.updateSetting('user_email', '');
    await this.updateSetting('user_avatar_initial', 'A');
    await this.updateSetting('user_auth_provider', 'guest');
    await this.updateSetting('has_seen_onboarding', '1');
  }

  public async clearCompletedTasks(): Promise<number> {
    await this.init();
    const res = await this.getDb().run("DELETE FROM tasks WHERE status = 'completed';");
    return res.rowsAffected;
  }

  public async exportBackupJson(): Promise<string> {
    await this.init();
    const db = this.getDb();
    const tasks = await db.getAll('SELECT * FROM tasks;');
    const sources = await db.getAll('SELECT * FROM task_sources;');
    const profiles = await db.getAll('SELECT * FROM reminder_profiles;');
    const stages = await db.getAll('SELECT * FROM profile_stages;');
    const occurrences = await db.getAll('SELECT * FROM reminder_occurrences;');
    const settings = await db.getAll('SELECT * FROM app_settings;');

    return JSON.stringify(
      {
        version: 1,
        exported_at: new Date().toISOString(),
        tasks,
        sources,
        profiles,
        stages,
        occurrences,
        settings,
      },
      null,
      2
    );
  }
}

export const taskRepository = new TaskRepository();
