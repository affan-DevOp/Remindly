import { Platform } from 'react-native';
import * as SQLite from './sqliteDriver';
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  SecureStore = null;
}
import {
  TaskRecord,
  TaskSourceRecord,
  ReminderProfileRecord,
  ProfileStageRecord,
  ReminderOccurrenceRecord,
  AppSettingRecord,
  BUILTIN_PROFILES,
} from '../domain/types';

export const DB_NAME = 'remindly.db';

export interface ISqliteDatabase {
  exec(sql: string): Promise<void>;
  getAll<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;
  run(sql: string, params?: any[]): Promise<{ rowsAffected: number; lastInsertRowId?: number }>;
  transaction<T>(action: (db: ISqliteDatabase) => Promise<T>): Promise<T>;
}

export class MemorySqliteDatabase implements ISqliteDatabase {
  private transactionQueue: Promise<unknown> = Promise.resolve();
  private inTransaction = false;
  private tables: Record<string, any[]> = {
    tasks: [],
    task_sources: [],
    reminder_profiles: [],
    profile_stages: [],
    reminder_occurrences: [],
    app_settings: [],
    schema_migrations: [],
  };

  public async initPersistence(): Promise<void> {
    try {
      if (Platform.OS === 'web' || typeof SecureStore?.getItemAsync === 'function') {
        const raw = Platform.OS === 'web'
          ? globalThis.localStorage?.getItem('remindly_in_memory_backup')
          : await SecureStore.getItemAsync('remindly_in_memory_backup');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            for (const k of Object.keys(parsed)) {
              if (Array.isArray(parsed[k])) {
                this.tables[k] = parsed[k];
              }
            }
          }
        }
      }
    } catch (e) {
      // Non-fatal if secure store fails or is too large
    }
  }

  public async persistAsync(): Promise<void> {
    if (this.inTransaction) return;
    try {
      if (Platform.OS === 'web' || typeof SecureStore?.setItemAsync === 'function') {
        const dataToSave = {
          tasks: this.tables.tasks,
          app_settings: this.tables.app_settings,
          task_sources: this.tables.task_sources,
          reminder_profiles: this.tables.reminder_profiles,
          profile_stages: this.tables.profile_stages,
          reminder_occurrences: this.tables.reminder_occurrences,
          schema_migrations: this.tables.schema_migrations,
        };
        if (Platform.OS === 'web') globalThis.localStorage?.setItem('remindly_in_memory_backup', JSON.stringify(dataToSave));
        else await SecureStore.setItemAsync('remindly_in_memory_backup', JSON.stringify(dataToSave));
      }
    } catch (e) {
      // Non-fatal
    }
  }

  async exec(sql: string): Promise<void> {
    return Promise.resolve();
  }

  async getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const lower = sql.toLowerCase();
    for (const tableName of Object.keys(this.tables)) {
      if (lower.includes(`from ${tableName}`)) {
        let rows = [...this.tables[tableName]];
        if (lower.includes('where')) {
          if (tableName === 'reminder_occurrences') {
            if (lower.includes("status in ('pending', 'scheduled')")) {
              rows = rows.filter((r) => r.status === 'pending' || r.status === 'scheduled');
            }
            if (lower.includes('trigger_at_utc > ?') && params.length > 0) {
              const timeParam = params[params.length - 1];
              rows = rows.filter((r) => r.trigger_at_utc > timeParam);
            }
            if (lower.includes('task_id = ?') && params.length > 0) {
              rows = rows.filter((r) => r.task_id === params[0]);
            }
          } else {
            if (lower.includes("status != 'archived'")) {
              rows = rows.filter((r) => r.status !== 'archived');
            }
            if (lower.includes('user_id = ?') && params.length > 0) {
              const userParam = params.find((p) => typeof p === 'string' && (p.includes('@') || p.includes('guest') || p.includes('user') || p.length > 0)) || params[0];
              rows = rows.filter((r) => (r.user_id || 'local_guest') === userParam);
            }
            if (lower.includes('task_id = ?') && params.length > 0) {
              rows = rows.filter((r) => r.task_id === params[0]);
            } else if (lower.includes('profile_id = ?') && params.length > 0) {
              rows = rows.filter((r) => r.profile_id === params[0]);
            } else if (lower.includes('status = ?') && params.length > 0) {
              rows = rows.filter((r) => r.status === params[0]);
            } else if ((lower.includes(' where id = ?') || lower.includes(' and id = ?')) && params.length > 0) {
              rows = rows.filter((r) => r.id === params[0]);
            } else if (lower.includes('key = ?') && params.length > 0) {
              rows = rows.filter((r) => r.key === params[0]);
            }
          }
        }
        if (lower.includes('count(*)')) {
          return [{ count: rows.length }] as any;
        }
        if (lower.includes('max(version)')) {
          const maxVer = this.tables.schema_migrations.reduce((max, m) => Math.max(max, m.version || 0), 0);
          return [{ version: maxVer }] as any;
        }
        return rows as T[];
      }
    }
    return [];
  }

  async getFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.getAll<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async run(sql: string, params: any[] = []): Promise<{ rowsAffected: number; lastInsertRowId?: number }> {
    const lower = sql.toLowerCase();
    for (const tableName of Object.keys(this.tables)) {
      if (lower.includes(`into ${tableName}`)) {
        const table = this.tables[tableName];
        if (tableName === 'tasks') {
          const hasUserId = params.length >= 16;
          const item: TaskRecord = {
            id: params[0],
            user_id: hasUserId ? params[1] : 'local_guest',
            title: hasUserId ? params[2] : params[1],
            notes: hasUserId ? params[3] : params[2],
            status: hasUserId ? params[4] : params[3],
            priority: hasUserId ? params[5] : params[4],
            due_precision: hasUserId ? params[6] : params[5],
            due_at_utc: hasUserId ? params[7] : params[6],
            due_local_date: hasUserId ? params[8] : params[7],
            due_local_time: hasUserId ? params[9] : params[8],
            due_timezone: hasUserId ? params[10] : params[9],
            reminder_profile_id: hasUserId ? params[11] : params[10],
            created_at_utc: hasUserId ? params[12] : params[11],
            updated_at_utc: hasUserId ? params[13] : params[12],
            completed_at_utc: hasUserId ? params[14] : params[13],
            archived_at_utc: hasUserId ? params[15] : params[14],
          };
          const idx = table.findIndex((t) => t.id === item.id);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        } else if (tableName === 'task_sources') {
          const item: TaskSourceRecord = {
            id: params[0],
            task_id: params[1],
            source_app_label: params[2],
            source_app_package: params[3],
            source_url: params[4],
            source_excerpt: params[5],
            sender_label: params[6],
            subject: params[7],
            created_at_utc: params[8],
          };
          const idx = table.findIndex((t) => t.id === item.id);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        } else if (tableName === 'reminder_occurrences') {
          const item: ReminderOccurrenceRecord = params.length === 6 ? {
            id: params[0],
            task_id: params[1],
            profile_stage_id: null,
            trigger_at_utc: params[2],
            stage_label: params[3],
            status: 'pending',
            os_notification_id: null,
            schedule_attempt_count: 0,
            last_error: null,
            created_at_utc: params[4],
            updated_at_utc: params[5],
          } : {
            id: params[0],
            task_id: params[1],
            profile_stage_id: params[2],
            trigger_at_utc: params[3],
            stage_label: params[4],
            status: params[5],
            os_notification_id: params[6],
            schedule_attempt_count: params[7] || 0,
            last_error: params[8] || null,
            created_at_utc: params[9],
            updated_at_utc: params[10],
          };
          const idx = table.findIndex((t) => t.id === item.id);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        } else if (tableName === 'app_settings') {
          const item: AppSettingRecord = { key: params[0], value: params[1] };
          const idx = table.findIndex((t) => t.key === item.key);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        } else if (tableName === 'reminder_profiles') {
          const item: ReminderProfileRecord = {
            id: params[0],
            name: params[1],
            description: params[2],
            is_builtin: params[3],
            repeat_interval_minutes: params[4],
            max_repeats: params[5],
            created_at_utc: params[6],
            updated_at_utc: params[7],
          };
          const idx = table.findIndex((t) => t.id === item.id);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        } else if (tableName === 'profile_stages') {
          const item: ProfileStageRecord = {
            id: params[0],
            profile_id: params[1],
            sort_order: params[2],
            offset_minutes: params[3],
            stage_kind: params[4],
            enabled: params[5] !== undefined ? params[5] : 1,
          };
          const idx = table.findIndex((t) => t.id === item.id);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        } else if (tableName === 'schema_migrations') {
          const item = { version: Number(params[0]), applied_at_utc: String(params[1]) };
          const idx = table.findIndex((m) => m.version === item.version);
          if (idx >= 0) table[idx] = item;
          else table.push(item);
          this.persistAsync().catch(() => {});
          return { rowsAffected: 1 };
        }
      } else if (lower.includes(`delete from ${tableName}`)) {
        if (tableName === 'tasks' && lower.includes("where status = 'completed'")) {
          const len = this.tables.tasks.length;
          this.tables.tasks = this.tables.tasks.filter((t) => t.status !== 'completed');
          this.persistAsync().catch(() => {});
          return { rowsAffected: len - this.tables.tasks.length };
        } else if (params.length > 0 && lower.includes('where id = ?')) {
          const len = this.tables[tableName].length;
          this.tables[tableName] = this.tables[tableName].filter((r) => r.id !== params[0]);
          if (tableName === 'tasks') {
            this.tables.task_sources = this.tables.task_sources.filter((s) => s.task_id !== params[0]);
            this.tables.reminder_occurrences = this.tables.reminder_occurrences.filter((o) => o.task_id !== params[0]);
          }
          this.persistAsync().catch(() => {});
          return { rowsAffected: len - this.tables[tableName].length };
        } else if (params.length > 0 && lower.includes('where task_id = ?')) {
          const len = this.tables[tableName].length;
          this.tables[tableName] = this.tables[tableName].filter((r) => r.task_id !== params[0]);
          this.persistAsync().catch(() => {});
          return { rowsAffected: len - this.tables[tableName].length };
        }
      } else if (lower.includes(`update ${tableName}`)) {
        if (tableName === 'tasks') {
          if (lower.includes("status = 'completed'")) {
            const taskId = params[2];
            const task = this.tables.tasks.find((t) => t.id === taskId);
            if (task) {
              task.status = 'completed';
              task.completed_at_utc = params[0];
              task.updated_at_utc = params[1];
              this.persistAsync().catch(() => {});
              return { rowsAffected: 1 };
            }
          } else if (lower.includes("status = 'archived'")) {
            const taskId = params[2];
            const task = this.tables.tasks.find((t) => t.id === taskId);
            if (task) {
              task.status = 'archived';
              task.archived_at_utc = params[0];
              task.updated_at_utc = params[1];
              this.persistAsync().catch(() => {});
              return { rowsAffected: 1 };
            }
          } else if (lower.includes('status = ?')) {
            const taskId = params[2];
            const task = this.tables.tasks.find((t) => t.id === taskId);
            if (task) {
              task.status = params[0];
              task.completed_at_utc = params[1];
              this.persistAsync().catch(() => {});
              return { rowsAffected: 1 };
            }
          } else if (lower.includes('due_local_time = ?')) {
            const taskId = params[2];
            const task = this.tables.tasks.find((t) => t.id === taskId);
            if (task) {
              task.due_local_time = params[0];
              task.updated_at_utc = params[1];
              this.persistAsync().catch(() => {});
              return { rowsAffected: 1 };
            }
          } else if (lower.includes('user_id = ?')) {
            const targetUser = params[0];
            const sourceUser = params[1] || 'local_guest';
            let affected = 0;
            for (const t of this.tables.tasks) {
              if (t.user_id === sourceUser || !t.user_id) {
                t.user_id = targetUser;
                affected++;
              }
            }
            this.persistAsync().catch(() => {});
            return { rowsAffected: affected };
          }
        } else if (tableName === 'profile_stages' && lower.includes('enabled = 0')) {
          const stages = this.tables.profile_stages.filter((stage) => stage.profile_id === params[0]);
          stages.forEach((stage) => { stage.enabled = 0; });
          await this.persistAsync();
          return { rowsAffected: stages.length };
        } else if (tableName === 'reminder_occurrences' && lower.includes('update reminder_occurrences set')) {
          if (lower.includes("status = 'cancelled'")) {
            const isSnoozeOnly = lower.includes("stage_label like 'snooze%'");
            const taskId = params.length === 1 ? params[0] : params[1];
            let count = 0;
            this.tables.reminder_occurrences.forEach((o) => {
              if (o.task_id === taskId && (o.status === 'pending' || o.status === 'scheduled')) {
                if (isSnoozeOnly && !o.stage_label.startsWith('Snooze')) {
                  return;
                }
                o.status = 'cancelled';
                if (params.length > 1) o.updated_at_utc = params[0];
                count++;
              }
            });
            this.persistAsync().catch(() => {});
            return { rowsAffected: count };
          } else if (lower.includes("status = 'skipped'")) {
            const occId = params[0];
            const occ = this.tables.reminder_occurrences.find((o) => o.id === occId);
            if (occ) {
              occ.status = 'skipped';
              this.persistAsync().catch(() => {});
              return { rowsAffected: 1 };
            }
          } else if (lower.includes('status = ?') && lower.includes('id = ?')) {
            const occ = this.tables.reminder_occurrences.find((o) => o.id === params[3]);
            if (occ) {
              occ.status = params[0];
              occ.os_notification_id = params[1];
              occ.updated_at_utc = params[2];
              this.persistAsync().catch(() => {});
              return { rowsAffected: 1 };
            }
          } else if (lower.includes('status = ?') && lower.includes('task_id = ?')) {
            let count = 0;
            this.tables.reminder_occurrences.forEach((o) => {
              if (o.task_id === params[1] && (o.status === 'pending' || o.status === 'scheduled')) {
                o.status = params[0];
                count++;
              }
            });
            this.persistAsync().catch(() => {});
            return { rowsAffected: count };
          }
        }
      }
    }
    return { rowsAffected: 0 };
  }

  async transaction<T>(action: (db: ISqliteDatabase) => Promise<T>): Promise<T> {
    const operation = this.transactionQueue.then(async () => {
      const snapshot = JSON.parse(JSON.stringify(this.tables));
      this.inTransaction = true;
      try {
        return await action(this);
      } catch (error) {
        this.tables = snapshot;
        throw error;
      } finally {
        this.inTransaction = false;
        await this.persistAsync();
      }
    });
    this.transactionQueue = operation.catch(() => {});
    return operation;
  }
}

export class NativeSqliteDatabase implements ISqliteDatabase {
  private nativeDb: any;

  constructor(nativeDb: any) {
    this.nativeDb = nativeDb;
  }

  async exec(sql: string): Promise<void> {
    if (typeof this.nativeDb.execAsync === 'function') {
      await this.nativeDb.execAsync(sql);
    } else if (typeof this.nativeDb.execSync === 'function') {
      this.nativeDb.execSync(sql);
    }
  }

  async getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (typeof this.nativeDb.getAllAsync === 'function') {
      return await this.nativeDb.getAllAsync(sql, ...(params || []));
    } else if (typeof this.nativeDb.getAllSync === 'function') {
      return this.nativeDb.getAllSync(sql, ...(params || []));
    }
    return [];
  }

  async getFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (typeof this.nativeDb.getFirstAsync === 'function') {
      const res = await this.nativeDb.getFirstAsync(sql, ...(params || []));
      return res || null;
    } else if (typeof this.nativeDb.getFirstSync === 'function') {
      const res = this.nativeDb.getFirstSync(sql, ...(params || []));
      return res || null;
    }
    return null;
  }

  async run(sql: string, params: any[] = []): Promise<{ rowsAffected: number; lastInsertRowId?: number }> {
    if (typeof this.nativeDb.runAsync === 'function') {
      const res = await this.nativeDb.runAsync(sql, ...(params || []));
      return {
        rowsAffected: res?.changes || 0,
        lastInsertRowId: res?.lastInsertRowId,
      };
    } else if (typeof this.nativeDb.runSync === 'function') {
      const res = this.nativeDb.runSync(sql, ...(params || []));
      return {
        rowsAffected: res?.changes || 0,
        lastInsertRowId: res?.lastInsertRowId,
      };
    }
    return { rowsAffected: 0 };
  }

  async transaction<T>(action: (db: ISqliteDatabase) => Promise<T>): Promise<T> {
    if (typeof this.nativeDb.withTransactionAsync === 'function') {
      let result: T;
      await this.nativeDb.withTransactionAsync(async () => {
        result = await action(this);
      });
      return result!;
    }

    const spName = `sp_remindly_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    try {
      await this.exec(`SAVEPOINT ${spName};`);
      const result = await action(this);
      await this.exec(`RELEASE SAVEPOINT ${spName};`);
      return result;
    } catch (e) {
      try {
        await this.exec(`ROLLBACK TO SAVEPOINT ${spName};`);
      } catch (rbErr) {}
      throw e;
    }
  }
}

let dbInstance: ISqliteDatabase | null = null;

export function resetDbInstanceForTesting(): void {
  dbInstance = null;
}

export async function getSqliteDatabase(): Promise<ISqliteDatabase> {
  if (dbInstance) return dbInstance;

  const testRuntime = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test';
  if (Platform.OS === 'web' || testRuntime) {
    const memDb = new MemorySqliteDatabase();
    await memDb.initPersistence();
    dbInstance = memDb;
    return dbInstance;
  }

  // 1. Try modern Expo SQLite openDatabaseAsync
  try {
    if (typeof SQLite.openDatabaseAsync === 'function') {
      const native = await SQLite.openDatabaseAsync(DB_NAME);
      if (native) {
        dbInstance = new NativeSqliteDatabase(native);
        return dbInstance;
      }
    }
  } catch (asyncErr) {
    console.warn('[SQLite] openDatabaseAsync(remindly.db) failed, trying openDatabaseSync:', asyncErr);
  }

  // 2. Try synchronous openDatabaseSync
  try {
    if (typeof SQLite.openDatabaseSync === 'function') {
      const native = SQLite.openDatabaseSync(DB_NAME);
      if (native) {
        dbInstance = new NativeSqliteDatabase(native);
        return dbInstance;
      }
    }
  } catch (syncErr) {
    console.warn('[SQLite] openDatabaseSync(remindly.db) failed, trying legacy database:', syncErr);
  }

  // 3. Try legacy database name if 'remindly.db' had an issue
  try {
    if (typeof SQLite.openDatabaseAsync === 'function') {
      const native = await SQLite.openDatabaseAsync('omniremind.db');
      if (native) {
        dbInstance = new NativeSqliteDatabase(native);
        return dbInstance;
      }
    }
  } catch (legacyErr) {
    console.warn('[SQLite] legacy openDatabaseAsync(omniremind.db) failed:', legacyErr);
  }

  // 4. Graceful in-memory fallback - Never crash or lock out the user!
  console.warn('[SQLite] Native SQLite unavailable. Falling back to persistent in-memory database.');
  const fallbackDb = new MemorySqliteDatabase();
  await fallbackDb.initPersistence();
  dbInstance = fallbackDb;
  return dbInstance;
}
