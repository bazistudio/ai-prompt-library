import fs from "fs";
import path from "path";
import crypto from "crypto";
const archiver = require("archiver");
import { getDatabase, getDatabasePath } from "@/database/local/manager";
import { getSettingDb, SETTING_KEYS } from "@/database/local/settingsQueries";
import type { Database } from "better-sqlite3";
import {
  createBackupRecordDb,
  updateBackupRecordDb,
  getBackupHistoryDb,
  deleteBackupRecordDb,
  BackupHistoryRecord
} from "@/database/local/backupQueries";

// Helper to calculate SHA-256 hash
function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

/**
 * Executes a full backup:
 * 1. Safely copies SQLite DB using better-sqlite3 native backup (handles WAL).
 * 2. Zips the database and any configured storage assets.
 * 3. Calculates checksum and records history.
 * 4. Enforces retention.
 */
export async function executeBackup(): Promise<BackupHistoryRecord> {
  const db = getDatabase();
  
  // 1. Get configurations
  const configuredLocation = getSettingDb(db, SETTING_KEYS.BACKUP_LOCATION);
  const retentionCountStr = getSettingDb(db, SETTING_KEYS.BACKUP_RETENTION_COUNT) || "7";
  const retentionCount = parseInt(retentionCountStr, 10) || 7;

  if (!configuredLocation) {
    throw new Error("Backup location is not configured.");
  }

  // Ensure backup directory exists
  if (!fs.existsSync(configuredLocation)) {
    fs.mkdirSync(configuredLocation, { recursive: true });
  }

  const timestampId = Date.now();
  const dateStr = new Date(timestampId).toISOString().split("T")[0];
  const zipFileName = `AI-Prompt-Library-${dateStr}-${timestampId}.zip`;
  const zipFilePath = path.join(configuredLocation, zipFileName);

  // Initialize History Record (Pending)
  const recordId = `bk-${timestampId}`;
  const record: BackupHistoryRecord = {
    id: recordId,
    created_at: timestampId,
    file_name: zipFileName,
    file_path: zipFilePath,
    file_size: 0,
    status: "PENDING",
    backup_type: "MANUAL",
    error_message: null,
    checksum: null,
  };

  createBackupRecordDb(db, record);

  let tempDbPath: string | null = null;

  try {
    // 2. Perform SQLite Safe Backup
    // Create a temporary directory for the DB copy before zipping
    const tempDir = path.join(configuredLocation, ".temp_backup_staging");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    tempDbPath = path.join(tempDir, "prompt_library.db");
    
    // better-sqlite3 native backup safely handles WAL checkpointing
    // Note: backup() API is synchronous in some older versions, or returns a promise in newer.
    // The types say it returns a Promise.
    await db.backup(tempDbPath);

    // 3. Create ZIP Archive
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", {
        zlib: { level: 9 } // Maximum compression
      });

      output.on("close", () => resolve());
      archive.on("error", (err: any) => reject(err));

      archive.pipe(output);

      // Append safe SQLite snapshot
      archive.file(tempDbPath as string, { name: "database/prompt_library.db" });

      // Append Storage Assets (Markdown/Images) if configured
      const storagePath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
      if (storagePath && fs.existsSync(storagePath)) {
        // Exclude backups folder if it's inside the storage path
        // Exclude system/hidden files
        const ignorePattern = ["Backups/**", ".*/**", "node_modules/**"];
        
        archive.glob("**/*", {
          cwd: storagePath,
          ignore: ignorePattern,
          nodir: true
        }, { prefix: "storage/" });
      }

      archive.finalize();
    });

    // Clean up temporary database copy
    if (tempDbPath && fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
      // Remove temp dir if empty
      const tempDir = path.dirname(tempDbPath);
      if (fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    }

    // 4. Verification and Checksum
    if (!fs.existsSync(zipFilePath)) {
      throw new Error("Archive file was not created successfully.");
    }

    const stats = fs.statSync(zipFilePath);
    const checksum = await calculateFileHash(zipFilePath);

    // 5. Mark Success
    updateBackupRecordDb(db, recordId, {
      status: "SUCCESS",
      file_size: stats.size,
      checksum
    });

    // 6. Apply Retention Policy
    applyRetentionPolicy(db, configuredLocation, retentionCount);

    // Return the updated record
    return {
      ...record,
      status: "SUCCESS",
      file_size: stats.size,
      checksum
    };
  } catch (error: any) {
    // Mark Failure
    updateBackupRecordDb(db, recordId, {
      status: "FAILED",
      error_message: error.message || "Unknown error during backup"
    });

    // Cleanup partial ZIP if it exists
    if (fs.existsSync(zipFilePath)) {
      try {
        fs.unlinkSync(zipFilePath);
      } catch (e) {
        console.error("Failed to cleanup partial backup zip:", e);
      }
    }
    
    if (tempDbPath && fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath);
      } catch (e) {
        console.error("Failed to cleanup temp DB:", e);
      }
    }

    throw error;
  }
}

function applyRetentionPolicy(db: Database, backupDir: string, retentionCount: number) {
  try {
    const history = getBackupHistoryDb(db, 1000); // Get all reasonable history
    const successfulBackups = history.filter(h => h.status === "SUCCESS");
    
    if (successfulBackups.length <= retentionCount) {
      return; // Nothing to prune
    }

    // Identify backups to delete (older ones beyond retention count)
    const toDelete = successfulBackups.slice(retentionCount);

    for (const record of toDelete) {
      // Security Check: Ensure the path is within the configured backup directory
      const normalizedRecordPath = path.normalize(record.file_path);
      const normalizedBackupDir = path.normalize(backupDir);

      if (normalizedRecordPath.startsWith(normalizedBackupDir) && fs.existsSync(normalizedRecordPath)) {
        fs.unlinkSync(normalizedRecordPath);
      }
      
      // Remove from DB history
      deleteBackupRecordDb(db, record.id);
    }

    // Also prune FAILED records from DB to prevent infinite growth (keep last 10)
    const failedBackups = history.filter(h => h.status === "FAILED");
    if (failedBackups.length > 10) {
      const failedToDelete = failedBackups.slice(10);
      for (const record of failedToDelete) {
        deleteBackupRecordDb(db, record.id);
      }
    }

  } catch (error) {
    console.error("Failed to apply retention policy:", error);
  }
}
