import fs from "fs";
import { getDatabase, getDatabasePath } from "./manager";

export interface DatabaseHealthStats {
  dbPath: string;
  dbSizeBytes: number;
  walSizeBytes: number;
  totalSizeBytes: number;
  integrity: string;
  counts: {
    prompts: number;
    versions: number;
    categories: number;
    workspaces: number;
    auditLogs: number;
  };
  lastCheckTimestamp: string;
}

/**
 * Gathers health statistics and disk usage metrics for the active SQLite database.
 */
export function getDatabaseHealth(): DatabaseHealthStats {
  const db = getDatabase();
  const dbPath = getDatabasePath();
  const walPath = `${dbPath}-wal`;

  let dbSizeBytes = 0;
  let walSizeBytes = 0;

  try {
    if (fs.existsSync(dbPath)) {
      dbSizeBytes = fs.statSync(dbPath).size;
    }
    if (fs.existsSync(walPath)) {
      walSizeBytes = fs.statSync(walPath).size;
    }
  } catch (err) {
    console.error("[Maintenance] Error checking database file stats:", err);
  }

  let integrity = "ok";
  try {
    const row = db.pragma("integrity_check") as Array<{ integrity_check: string }>;
    if (row && row.length > 0) {
      integrity = row[0].integrity_check || "ok";
    }
  } catch (err) {
    integrity = `Error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Row counts
  const promptsCount = (db.prepare("SELECT COUNT(*) as count FROM prompts").get() as { count: number })?.count || 0;
  const versionsCount = (db.prepare("SELECT COUNT(*) as count FROM prompt_versions").get() as { count: number })?.count || 0;
  const categoriesCount = (db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number })?.count || 0;
  const workspacesCount = (db.prepare("SELECT COUNT(*) as count FROM workspaces").get() as { count: number })?.count || 0;
  const auditCount = (db.prepare("SELECT COUNT(*) as count FROM audit_log").get() as { count: number })?.count || 0;

  return {
    dbPath,
    dbSizeBytes,
    walSizeBytes,
    totalSizeBytes: dbSizeBytes + walSizeBytes,
    integrity,
    counts: {
      prompts: promptsCount,
      versions: versionsCount,
      categories: categoriesCount,
      workspaces: workspacesCount,
      auditLogs: auditCount,
    },
    lastCheckTimestamp: new Date().toISOString(),
  };
}

/**
 * Runs SQLite VACUUM and PRAGMA optimize to defragment indexes and reclaim disk space.
 */
export function vacuumAndOptimizeDatabase(): {
  success: boolean;
  freedBytes: number;
  beforeStats: DatabaseHealthStats;
  afterStats: DatabaseHealthStats;
} {
  const beforeStats = getDatabaseHealth();
  const db = getDatabase();

  try {
    // Run SQLite native VACUUM and optimize
    db.exec("VACUUM;");
    db.pragma("optimize;");
    
    const afterStats = getDatabaseHealth();
    const freedBytes = Math.max(0, beforeStats.totalSizeBytes - afterStats.totalSizeBytes);

    return {
      success: true,
      freedBytes,
      beforeStats,
      afterStats,
    };
  } catch (err) {
    console.error("[Maintenance] VACUUM failed:", err);
    throw err;
  }
}

/**
 * Reads and returns the raw SQLite database file buffer for snapshot export.
 */
export function getRawDatabaseBuffer(): { buffer: Buffer; filename: string } {
  const dbPath = getDatabasePath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at: ${dbPath}`);
  }

  // Force checkpoint to sync WAL before creating snapshot
  const db = getDatabase();
  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
  } catch (err) {
    console.warn("[Maintenance] wal_checkpoint non-fatal error:", err);
  }

  const buffer = fs.readFileSync(dbPath);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `prompt_library_backup_${dateStr}.db`;

  return { buffer, filename };
}
