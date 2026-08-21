import { Database } from "better-sqlite3";

export function getSettingDb(db: Database, key: string): string | null {
  const stmt = db.prepare(`SELECT value FROM app_settings WHERE key = ?`);
  const row = stmt.get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSettingDb(db: Database, key: string, value: string | null): { success: boolean } {
  const now = Date.now();
  if (value === null || value === undefined) {
    const stmt = db.prepare(`DELETE FROM app_settings WHERE key = ?`);
    stmt.run(key);
  } else {
    const stmt = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, value, now);
  }
  return { success: true };
}

export const SETTING_KEYS = {
  PROMPT_LIBRARY_STORAGE_PATH: "promptLibraryStoragePath",
  APP_LOCK_ENABLED: "appLockEnabled",
  APP_LOCK_METHOD: "appLockMethod",
  APP_LOCK_PASSWORD_HASH: "appLockPasswordHash",
  APP_LOCK_PIN_HASH: "appLockPinHash",
  APP_LOCK_RECOVERY_KEY_HASH: "appLockRecoveryKeyHash",
  APP_LOCK_SECURITY_QUESTIONS: "appLockSecurityQuestions",
  REQUIRE_LOCK_ON_STARTUP: "requireLockOnStartup",
  APP_LOCK_FAILED_ATTEMPTS: "appLockFailedAttempts",
  APP_LOCK_LOCKOUT_UNTIL: "appLockLockoutUntil",
  BACKUP_AUTO_ENABLED: "backupAutoEnabled",
  BACKUP_FREQUENCY: "backupFrequency",
  BACKUP_RETENTION_COUNT: "backupRetentionCount",
  BACKUP_LOCATION: "backupLocation",
};
