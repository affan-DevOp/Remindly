// Web uses the localStorage-backed MemorySqliteDatabase. Do not bundle Expo's
// native SQLite worker (which requires WASM and cross-origin isolation).
export const openDatabaseAsync: typeof import('expo-sqlite')['openDatabaseAsync'] | undefined = undefined;
export const openDatabaseSync: typeof import('expo-sqlite')['openDatabaseSync'] | undefined = undefined;
