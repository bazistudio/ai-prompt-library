import Database from "better-sqlite3";
import { getDatabase, getDatabasePath } from "./manager";
import { migrateLegacyDatabase } from "./migration";

let migrationChecked = false;

/**
 * Compatibility adapter for Next.js server API routes and store methods.
 * Delegates connection creation and path resolution to DatabaseManager.
 */
export function getSQLiteDB(): Database.Database {
  const db = getDatabase();

  if (!migrationChecked) {
    migrationChecked = true;
    try {
      migrateLegacyDatabase(db);
    } catch (err) {
      console.error("⚠️ [DatabaseAdapter] Error checking legacy migration:", err);
    }
  }

  return db;
}
