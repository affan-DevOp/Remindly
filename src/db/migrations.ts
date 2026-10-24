import { ISqliteDatabase } from './sqliteDatabase';
import { BUILTIN_PROFILES } from '../domain/types';

export const SCHEMA_VERSION = 3;

export async function runMigrations(db: ISqliteDatabase): Promise<void> {
  try {
    await db.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // Non-fatal if driver does not support PRAGMA
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at_utc TEXT NOT NULL
    );
  `);

  const current = await db.getFirst<{ version: number }>('SELECT MAX(version) as version FROM schema_migrations;');
  const currentVersion = current?.version || 0;

  if (currentVersion < 1) {
    await db.transaction(async (tx) => {
      await tx.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'local_guest',
          title TEXT NOT NULL,
          notes TEXT,
          status TEXT NOT NULL,
          priority TEXT NOT NULL,
          due_precision TEXT NOT NULL,
          due_at_utc TEXT,
          due_local_date TEXT,
          due_local_time TEXT,
          due_timezone TEXT NOT NULL,
          reminder_profile_id TEXT,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL,
          completed_at_utc TEXT,
          archived_at_utc TEXT
        );
      `);

      await tx.exec(`
        CREATE TABLE IF NOT EXISTS task_sources (
          id TEXT PRIMARY KEY NOT NULL,
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          source_app_label TEXT,
          source_app_package TEXT,
          source_url TEXT,
          source_excerpt TEXT,
          sender_label TEXT,
          subject TEXT,
          created_at_utc TEXT NOT NULL
        );
      `);

      await tx.exec(`
        CREATE TABLE IF NOT EXISTS reminder_profiles (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          is_builtin INTEGER NOT NULL,
          repeat_interval_minutes INTEGER,
          max_repeats INTEGER NOT NULL DEFAULT 0,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL
        );
      `);

      await tx.exec(`
        CREATE TABLE IF NOT EXISTS profile_stages (
          id TEXT PRIMARY KEY NOT NULL,
          profile_id TEXT NOT NULL REFERENCES reminder_profiles(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL,
          offset_minutes INTEGER NOT NULL,
          stage_kind TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1
        );
      `);

      await tx.exec(`
        CREATE TABLE IF NOT EXISTS reminder_occurrences (
          id TEXT PRIMARY KEY NOT NULL,
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          profile_stage_id TEXT REFERENCES profile_stages(id) ON DELETE SET NULL,
          trigger_at_utc TEXT NOT NULL,
          stage_label TEXT NOT NULL,
          status TEXT NOT NULL,
          os_notification_id TEXT,
          schedule_attempt_count INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at_utc TEXT NOT NULL,
          updated_at_utc TEXT NOT NULL
        );
      `);

      await tx.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);

      try {
        await tx.exec(`
          CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status, due_at_utc);
          CREATE INDEX IF NOT EXISTS idx_occurrences_status_trigger ON reminder_occurrences(status, trigger_at_utc);
          CREATE INDEX IF NOT EXISTS idx_occurrences_task_id ON reminder_occurrences(task_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
        `);
      } catch (idxErr) {}

      await tx.run(
        'INSERT INTO schema_migrations (version, applied_at_utc) VALUES (?, ?);',
        [1, new Date().toISOString()]
      );
    });
  }

  if (currentVersion < 2) {
    await db.transaction(async (tx) => {
      try {
        const columns = await tx.getAll<{ name: string }>('PRAGMA table_info(tasks);');
        const hasUserId = columns && columns.some((c) => c.name === 'user_id');
        if (!hasUserId) {
          await tx.exec("ALTER TABLE tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'local_guest';");
        }
      } catch (alterErr) {
        // Safe ignore if column exists
      }
      try {
        await tx.exec('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);');
      } catch (e) {}
      await tx.run(
        'INSERT INTO schema_migrations (version, applied_at_utc) VALUES (?, ?);',
        [2, new Date().toISOString()]
      );
    });
  }

  if (currentVersion < 3) {
    await db.transaction(async (tx) => {
      // Refresh builtin_persistent stages to exactly 2 bounded follow-ups (+15m and +60m)
      const persistentDef = BUILTIN_PROFILES.find((p) => p.id === 'builtin_persistent');
      if (persistentDef) {
        await tx.run('DELETE FROM profile_stages WHERE profile_id = ?;', [persistentDef.id]);
        await tx.run(
          'UPDATE reminder_profiles SET description = ?, max_repeats = ? WHERE id = ?;',
          [persistentDef.description, persistentDef.max_repeats, persistentDef.id]
        );
        for (const stage of persistentDef.stages) {
          const stageId = `stage-${persistentDef.id}-${stage.sort_order}`;
          await tx.run(
            'INSERT INTO profile_stages (id, profile_id, sort_order, offset_minutes, stage_kind, enabled) VALUES (?, ?, ?, ?, ?, 1);',
            [stageId, persistentDef.id, stage.sort_order, stage.offset_minutes, stage.stage_kind]
          );
        }
      }

      await tx.run(
        'INSERT INTO schema_migrations (version, applied_at_utc) VALUES (?, ?);',
        [3, new Date().toISOString()]
      );
    });
  }

  for (const def of BUILTIN_PROFILES) {
    const existing = await db.getFirst(
      'SELECT id FROM reminder_profiles WHERE id = ?;',
      [def.id]
    );

    if (!existing) {
      const nowIso = new Date().toISOString();
      await db.run(
        'INSERT INTO reminder_profiles (id, name, description, is_builtin, repeat_interval_minutes, max_repeats, created_at_utc, updated_at_utc) VALUES (?, ?, ?, 1, ?, ?, ?, ?);',
        [def.id, def.name, def.description, def.repeat_interval_minutes, def.max_repeats, nowIso, nowIso]
      );

      for (const stage of def.stages) {
        const stageId = `stage-${def.id}-${stage.sort_order}`;
        await db.run(
          'INSERT INTO profile_stages (id, profile_id, sort_order, offset_minutes, stage_kind, enabled) VALUES (?, ?, ?, ?, ?, 1);',
          [stageId, def.id, stage.sort_order, stage.offset_minutes, stage.stage_kind]
        );
      }
    }
  }

  const defaultSettings: Record<string, string> = {
    default_profile_id: 'builtin_standard',
    default_date_only_time: '09:00',
    quiet_hours_enabled: '1',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    theme_mode: 'system',
    has_seen_onboarding: '0',
    notifications_sound_enabled: '1',
    notifications_vibration_enabled: '1',
    persistent_followups_enabled: '1',
    lock_screen_privacy: '0',
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    const existing = await db.getFirst('SELECT key FROM app_settings WHERE key = ?;', [key]);
    if (!existing) {
      await db.run('INSERT INTO app_settings (key, value) VALUES (?, ?);', [key, val]);
    }
  }
}