import { getTimeSortValue, isTaskOnSelectedDate, formatTimeLabel } from '../src/utils/taskScheduling';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { taskRepository, INITIAL_SEED_TASKS } from '../src/services/taskRepository';
import { materializeOccurrences, formatStageLabel } from '../src/domain/occurrenceMaterializer';
import { TaskRecord, BUILTIN_PROFILES, ProfileStageRecord } from '../src/domain/types';

describe('Phase 2 — Domain Model, SQLite Migrations & Occurrence Materializer', () => {
  beforeEach(async () => {
    await taskRepository.init();
  });

  describe('Migrations & Idempotent Profile Seeding', () => {
    test('Loads built-in reminder profiles with valid stage offsets', () => {
      expect(BUILTIN_PROFILES.length).toBe(4);
      const standard = BUILTIN_PROFILES.find((p) => p.id === 'builtin_standard');
      expect(standard).toBeDefined();
      expect(standard?.stages.length).toBe(3);
      expect(standard?.stages.map((s) => s.offset_minutes)).toEqual([-1440, -60, 0]);

      const persistent = BUILTIN_PROFILES.find((p) => p.id === 'builtin_persistent');
      expect(persistent?.max_repeats).toBe(2);
      expect(persistent?.stages.some((s) => s.offset_minutes === 15)).toBe(true);
    });

    test('Loads initial seed tasks and preserves overdue status for past tasks', async () => {
      const tasks = await taskRepository.getAllTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(INITIAL_SEED_TASKS.length);
      const overdue = tasks.find((t) => t.id === 'task-101');
      expect(overdue).toBeDefined();
      expect(overdue?.status).toBe('overdue');
    });
  });

  describe('Occurrence Materializer Engine', () => {
    const fixedNow = new Date('2026-10-24T10:00:00.000Z');
    const futureDue = new Date('2026-10-25T10:00:00.000Z'); // 24 hours in future

    const sampleTask: TaskRecord = {
      id: 'task-test-occ',
      title: 'Submit quarterly budget',
      notes: 'Reviewed by finance lead',
      status: 'scheduled',
      priority: 'important',
      due_precision: 'datetime',
      due_at_utc: futureDue.toISOString(),
      due_local_date: '2026-10-25',
      due_local_time: '15:30',
      due_timezone: 'Asia/Kolkata',
      reminder_profile_id: 'builtin_important',
      created_at_utc: fixedNow.toISOString(),
      updated_at_utc: fixedNow.toISOString(),
      completed_at_utc: null,
      archived_at_utc: null,
    };

    const importantStages: ProfileStageRecord[] = [
      { id: 's1', profile_id: 'builtin_important', sort_order: 1, offset_minutes: -1440, stage_kind: 'heads_up', enabled: 1 },
      { id: 's2', profile_id: 'builtin_important', sort_order: 2, offset_minutes: -240, stage_kind: 'prep', enabled: 1 },
      { id: 's3', profile_id: 'builtin_important', sort_order: 3, offset_minutes: -15, stage_kind: 'urgent', enabled: 1 },
      { id: 's4', profile_id: 'builtin_important', sort_order: 4, offset_minutes: 0, stage_kind: 'deadline', enabled: 1 },
    ];

    test('Materializes future stages as pending with chronological ordering', () => {
      const occurrences = materializeOccurrences(sampleTask, importantStages, null, fixedNow);
      expect(occurrences.length).toBe(4);
      expect(occurrences[0].stage_label).toBe('-24h');
      expect(occurrences[0].status).toBe('skipped'); // exactly at fixedNow (10:00)
      expect(occurrences[1].stage_label).toBe('-4h');
      expect(occurrences[1].status).toBe('pending');
      expect(occurrences[3].stage_label).toBe('Due');
      expect(occurrences[3].status).toBe('pending');
    });

    test('Skips past stages when task is created close to deadline', () => {
      const closeNow = new Date(futureDue.getTime() - 30 * 60 * 1000);
      const occurrences = materializeOccurrences(sampleTask, importantStages, null, closeNow);

      const skipped = occurrences.filter((o) => o.status === 'skipped');
      const pending = occurrences.filter((o) => o.status === 'pending');

      expect(skipped.length).toBe(2);
      expect(pending.length).toBe(2);
      expect(pending[0].stage_label).toBe('-15m');
      expect(pending[1].stage_label).toBe('Due');
    });

    test('Returns zero occurrences for tasks without due date (Inbox)', () => {
      const inboxTask: TaskRecord = { ...sampleTask, due_precision: 'none', due_at_utc: null };
      const occurrences = materializeOccurrences(inboxTask, importantStages, null, fixedNow);
      expect(occurrences).toEqual([]);
    });

    test('Marks all occurrences as cancelled if task is already completed', () => {
      const completedTask: TaskRecord = { ...sampleTask, status: 'completed' };
      const occurrences = materializeOccurrences(completedTask, importantStages, null, fixedNow);
      expect(occurrences.every((o) => o.status === 'cancelled')).toBe(true);
    });

    test('Formats stage labels cleanly', () => {
      expect(formatStageLabel(0, 'deadline')).toBe('Due');
      expect(formatStageLabel(-1440, 'heads_up')).toBe('-24h');
      expect(formatStageLabel(-60, 'prep')).toBe('-1h');
      expect(formatStageLabel(-15, 'urgent')).toBe('-15m');
      expect(formatStageLabel(15, 'persistent_follow_up', 1, 3)).toBe('+15m (1/3)');
    });
  });

  describe('Task Domain CRUD & Foreign Key Cascade', () => {
    test('Persists a full domain task and retrieves it by ID', async () => {
      const now = new Date();
      const domainTask: TaskRecord = {
        id: 'domain-task-uuid-1',
        title: 'Sign residential lease agreement',
        notes: 'Deposit check attached',
        status: 'scheduled',
        priority: 'important',
        due_precision: 'datetime',
        due_at_utc: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
        due_local_date: '2026-10-26',
        due_local_time: '14:00',
        due_timezone: 'Asia/Kolkata',
        reminder_profile_id: 'builtin_standard',
        created_at_utc: now.toISOString(),
        updated_at_utc: now.toISOString(),
        completed_at_utc: null,
        archived_at_utc: null,
      };

      await taskRepository.saveDomainTask(domainTask, {
        source_app_label: 'Gmail',
        source_url: 'https://mail.google.com/mail/u/0/#inbox/abc',
        source_excerpt: 'Please sign and return the lease by Monday',
      });

      const retrieved = await taskRepository.getDomainTask('domain-task-uuid-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Sign residential lease agreement');
      expect(retrieved?.due_precision).toBe('datetime');

      const occurrences = await taskRepository.getOccurrencesForTask('domain-task-uuid-1');
      expect(occurrences.length).toBeGreaterThan(0);
      expect(occurrences.some((o) => o.stage_label === 'Due')).toBe(true);
    });

    test('Completing task cancels pending occurrences atomically', async () => {
      await taskRepository.completeTask('domain-task-uuid-1');
      const retrieved = await taskRepository.getDomainTask('domain-task-uuid-1');
      expect(retrieved?.status).toBe('completed');
      expect(retrieved?.completed_at_utc).not.toBeNull();

      const occurrences = await taskRepository.getOccurrencesForTask('domain-task-uuid-1');
      const activeOccurrences = occurrences.filter((o) => o.status === 'pending' || o.status === 'scheduled');
      expect(activeOccurrences.length).toBe(0);
    });

    test('Deleting a task cascades deletion of task_sources and occurrences', async () => {
      await taskRepository.deleteTask('domain-task-uuid-1');
      const retrieved = await taskRepository.getDomainTask('domain-task-uuid-1');
      expect(retrieved).toBeNull();

      const occurrences = await taskRepository.getOccurrencesForTask('domain-task-uuid-1');
      expect(occurrences.length).toBe(0);
    });

    test('Exports valid JSON backup with all tables', async () => {
      const backupJson = await taskRepository.exportBackupJson();
      expect(backupJson).toBeTruthy();
      const parsed = JSON.parse(backupJson);
      expect(parsed.version).toBe(1);
      expect(Array.isArray(parsed.tasks)).toBe(true);
      expect(Array.isArray(parsed.profiles)).toBe(true);
      expect(Array.isArray(parsed.settings)).toBe(true);
    });
  });

  describe('Local Multi-User Isolation (Option A)', () => {
    test('Isolates tasks between different user accounts without data leakage', async () => {
      // 1. Create task for Alice
      await taskRepository.saveTask({
        id: 'alice-task-1',
        title: "Alice's Project Presentation",
        timeLabel: '2:00 PM',
        dateLabel: 'Today',
        status: 'upcoming',
        source: 'Manual',
        excerpt: 'Prepare slides for Alice',
        profile: 'Standard',
        createdAt: Date.now(),
      }, 'alice@example.com');

      // 2. Create task for Bob
      await taskRepository.saveTask({
        id: 'bob-task-1',
        title: "Bob's Team Review",
        timeLabel: '4:00 PM',
        dateLabel: 'Today',
        status: 'upcoming',
        source: 'Manual',
        excerpt: 'Review team performance for Bob',
        profile: 'Important',
        createdAt: Date.now(),
      }, 'bob@example.com');

      // 3. Query Alice tasks explicitly
      const aliceTasks = await taskRepository.getAllTasks('alice@example.com');
      expect(aliceTasks.some((t) => t.id === 'alice-task-1')).toBe(true);
      expect(aliceTasks.some((t) => t.id === 'bob-task-1')).toBe(false);

      // 4. Query Bob tasks explicitly
      const bobTasks = await taskRepository.getAllTasks('bob@example.com');
      expect(bobTasks.some((t) => t.id === 'bob-task-1')).toBe(true);
      expect(bobTasks.some((t) => t.id === 'alice-task-1')).toBe(false);

      // 5. Switch active user context to Alice
      taskRepository.setCurrentUserId('alice@example.com');
      const activeAliceTasks = await taskRepository.getAllTasks();
      expect(activeAliceTasks.some((t) => t.id === 'alice-task-1')).toBe(true);
      expect(activeAliceTasks.some((t) => t.id === 'bob-task-1')).toBe(false);

      // 6. Logout and switch back to local_guest
      await taskRepository.logoutUser();
      const guestTasks = await taskRepository.getAllTasks();
      expect(guestTasks.some((t) => t.id === 'alice-task-1')).toBe(false);
      expect(guestTasks.some((t) => t.id === 'bob-task-1')).toBe(false);
      expect(guestTasks.some((t) => t.id === 'task-101')).toBe(true);
    });
  });


  describe('Timeline Filtering, Time Sorting & Important Priority', () => {
    test('getTimeSortValue accurately sorts 12-hour AM/PM times in chronological order', () => {
      const tasks: any[] = [
        { id: '1', title: 'Late evening', timeLabel: '8:30 PM' },
        { id: '2', title: 'Morning kickoff', timeLabel: '9:00 AM' },
        { id: '3', title: 'Afternoon wrap', timeLabel: '2:00 PM' },
        { id: '4', title: 'No deadline task', timeLabel: 'No deadline' },
        { id: '5', title: 'Lunch sync', timeLabel: '12:30 PM' },
        { id: '6', title: 'Post-lunch call', timeLabel: '1:15 PM' },
        { id: '7', title: 'Late morning', timeLabel: '11:30 AM' },
      ];

      const sorted = [...tasks].sort((a, b) => getTimeSortValue(a) - getTimeSortValue(b));
      expect(sorted.map((t) => t.id)).toEqual(['2', '7', '5', '6', '3', '1', '4']);
    });

    test('getTimeSortValue parses 24-hour and relative time values', () => {
      expect(getTimeSortValue({ timeLabel: '09:00' } as any)).toBe(540);
      expect(getTimeSortValue({ timeLabel: '14:30' } as any)).toBe(870);
      expect(getTimeSortValue({ timeLabel: 'No deadline' } as any)).toBe(99999);
    });

    test('formatTimeLabel correctly converts 24h to 12h AM/PM strings', () => {
      expect(formatTimeLabel('09:00')).toBe('9:00 AM');
      expect(formatTimeLabel('14:30')).toBe('2:30 PM');
      expect(formatTimeLabel('00:45')).toBe('12:45 AM');
      expect(formatTimeLabel('12:00')).toBe('12:00 PM');
      expect(formatTimeLabel('9:00 AM')).toBe('9:00 AM');
      expect(formatTimeLabel('In 15 min')).toBe('In 15 min');
      expect(formatTimeLabel(null)).toBe('No deadline');
    });

    test('isTaskOnSelectedDate filters reminders accurately for today, tomorrow, and custom dates', () => {
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const todayTask: any = { id: 't1', dateLabel: 'Today', status: 'upcoming', dueLocalDate: todayIso };
      const overdueTask: any = { id: 't2', dateLabel: 'Today', status: 'overdue' };
      const tomorrowTask: any = { id: 't3', dateLabel: 'Tomorrow', status: 'upcoming', dueLocalDate: tomorrowIso };
      const inboxTask: any = { id: 't4', dateLabel: 'Inbox', status: 'inbox' };
      const customTask: any = { id: 't5', dateLabel: 'Oct 28', status: 'upcoming', dueLocalDate: '2026-10-28' };

      // Testing Today filter
      expect(isTaskOnSelectedDate(todayTask, todayIso, true, false, today, today.getDate())).toBe(true);
      expect(isTaskOnSelectedDate(overdueTask, todayIso, true, false, today, today.getDate())).toBe(true);
      expect(isTaskOnSelectedDate(tomorrowTask, todayIso, true, false, today, today.getDate())).toBe(false);
      expect(isTaskOnSelectedDate(inboxTask, todayIso, true, false, today, today.getDate())).toBe(false);

      // Testing Tomorrow filter
      expect(isTaskOnSelectedDate(todayTask, tomorrowIso, false, true, tomorrow, tomorrow.getDate())).toBe(false);
      expect(isTaskOnSelectedDate(tomorrowTask, tomorrowIso, false, true, tomorrow, tomorrow.getDate())).toBe(true);

      // Testing Custom Date filter
      const oct28Date = new Date('2026-10-28T12:00:00Z');
      expect(isTaskOnSelectedDate(customTask, '2026-10-28', false, false, oct28Date, 28)).toBe(true);
      expect(isTaskOnSelectedDate(todayTask, '2026-10-28', false, false, oct28Date, 28)).toBe(false);
    });

    test('Assigning and persisting important flag in SQLite tasks', async () => {
      const importantTask: any = {
        id: 'important-task-99',
        title: 'Review urgent executive deck',
        timeLabel: '3:00 PM',
        dateLabel: 'Today',
        status: 'upcoming',
        source: 'Slack',
        excerpt: 'High priority board presentation review',
        important: true,
        profile: 'Important',
        createdAt: Date.now(),
        dueLocalDate: '2026-10-24',
        dueLocalTime: '15:00',
      };

      await taskRepository.saveTask(importantTask, 'test_user_imp@example.com');
      const retrieved = await taskRepository.getAllTasks('test_user_imp@example.com');
      const saved = retrieved.find((t) => t.id === 'important-task-99');

      expect(saved).toBeDefined();
      expect(saved?.important).toBe(true);
      expect(saved?.profile).toBe('Important');
      expect(saved?.timeLabel).toBe('3:00 PM');
    });
  });

});
