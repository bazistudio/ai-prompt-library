import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './schema';

let _dbInstance: Database.Database | null = null;
let _customDbPath: string | null = null;

/**
 * Resolves the OS-specific user data directory without relying on Electron APIs.
 * This makes it safe to run in both Node.js (Next.js server) and Electron processes.
 */
export function getDefaultDatabasePath(): string {
  const appName = process.env.NODE_ENV === 'development' ? 'ai-prompt-library-dev' : 'ai-prompt-library';
  const fileName = 'prompt_library.db';

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
    return path.join(appData, appName, fileName);
  }

  if (process.platform === 'darwin') {
    const home = process.env.HOME || '';
    return path.join(home, 'Library', 'Application Support', appName, fileName);
  }

  // Linux and other POSIX
  const dataHome = process.env.XDG_DATA_HOME || path.join(process.env.HOME || '', '.config');
  return path.join(dataHome, appName, fileName);
}

/**
 * Returns the active SQLite database file path.
 */
export function getDatabasePath(): string {
  if (_customDbPath) {
    return _customDbPath;
  }

  // Allow explicit override if provided via environment variable and not a generic default
  if (process.env.SQLITE_DB_PATH && !process.env.SQLITE_DB_PATH.includes('prompt-library.db')) {
    return path.resolve(process.env.SQLITE_DB_PATH);
  }

  return getDefaultDatabasePath();
}

/**
 * Sets a custom database path (useful for testing or future Settings -> Storage updates).
 */
export function setDatabasePath(newPath: string): void {
  if (_dbInstance) {
    closeDatabase();
  }
  _customDbPath = path.resolve(newPath);
}

/**
 * Gets or initializes the single SQLite database connection for the current process.
 */
export function getDatabase(): Database.Database {
  if (_dbInstance && _dbInstance.open) {
    return _dbInstance;
  }

  const dbPath = getDatabasePath();
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    _dbInstance = new Database(dbPath);

    // Enforce WAL mode and foreign key constraints for performance & safety
    _dbInstance.pragma('journal_mode = WAL');
    _dbInstance.pragma('foreign_keys = ON');

    // Run unified schema initialization
    initializeSchema(_dbInstance);

    console.log(`💾 [DatabaseManager] SQLite database active at: ${dbPath}`);
  } catch (error) {
    console.error(`❌ [DatabaseManager] Failed to initialize SQLite database at ${dbPath}:`, error);
    throw error;
  }

  return _dbInstance;
}

/**
 * Safely closes the database connection for the current process.
 */
export function closeDatabase(): void {
  if (_dbInstance) {
    try {
      if (_dbInstance.open) {
        _dbInstance.close();
      }
    } catch (err) {
      console.error('Failed to close database:', err);
    } finally {
      _dbInstance = null;
    }
  }
}
