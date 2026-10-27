import { NativeSqliteDatabase } from '../src/db/sqliteDatabase';
import { runMigrations } from '../src/db/migrations';

// Exercise SQLite's real foreign-key constraints, which the fallback test store
// cannot enforce. Node 24 includes SQLite and this creates no files.
const { DatabaseSync } = require('node:sqlite');

function openDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  const db = new NativeSqliteDatabase({
    execSync: (sql: string) => sqlite.exec(sql),
    getAllSync: (sql: string, ...params: any[]) => sqlite.prepare(sql).all(...params),
    getFirstSync: (sql: string, ...params: any[]) => sqlite.prepare(sql).get(...params),
    runSync: (sql: string, ...params: any[]) => {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
  });
  return { db, close: () => sqlite.close() };
}

test('fresh native SQLite initialization seeds parent profiles before their stages', async () => {
  const { db, close } = openDatabase();
  try {
    await runMigrations(db);
    expect((await db.getAll('SELECT * FROM reminder_profiles;')).length).toBe(4);
    expect((await db.getAll('SELECT * FROM profile_stages;')).length).toBeGreaterThan(0);
    expect(await db.getAll('PRAGMA foreign_key_check;')).toEqual([]);
    await runMigrations(db);
    expect((await db.getAll('SELECT * FROM reminder_profiles;')).length).toBe(4);
  } finally { close(); }
});

test('profile migration preserves stage references from existing reminders', async () => {
  const { db, close } = openDatabase();
  try {
    await runMigrations(db);
    await db.exec(`
      DELETE FROM schema_migrations WHERE version = 3;
      INSERT INTO tasks (id, title, status, priority, due_precision, due_timezone, created_at_utc, updated_at_utc)
        VALUES ('upgrade-task', 'Existing reminder', 'scheduled', 'normal', 'datetime', 'UTC', '2026-10-27', '2026-10-27');
      INSERT INTO reminder_occurrences (id, task_id, profile_stage_id, trigger_at_utc, stage_label, status, created_at_utc, updated_at_utc)
        VALUES ('upgrade-occurrence', 'upgrade-task', 'stage-builtin_persistent-1', '2026-10-28T12:00:00Z', '-24h', 'pending', '2026-10-27', '2026-10-27');
    `);
    await runMigrations(db);
    expect(await db.getFirst('SELECT * FROM reminder_occurrences WHERE id = ?;', ['upgrade-occurrence'])).toBeTruthy();
    expect(await db.getAll('PRAGMA foreign_key_check;')).toEqual([]);
  } finally { close(); }
});
