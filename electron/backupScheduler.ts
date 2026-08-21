import { net } from "electron";

let schedulerInterval: NodeJS.Timeout | null = null;
let isBackupRunning = false;

// Check every 15 minutes (or an appropriate interval)
const POLL_INTERVAL_MS = 15 * 60 * 1000;

let getServerUrlGetter: () => string = () => "http://127.0.0.1:3000";

export function startBackupScheduler(urlGetter?: () => string): void {
  if (urlGetter) {
    getServerUrlGetter = urlGetter;
  }

  if (schedulerInterval) {
    return; // Already running
  }
  
  console.log("[BackupScheduler] Starting automatic backup scheduler...");
  
  // Initial check shortly after startup
  setTimeout(() => {
    checkAndRunBackup().catch(err => {
      console.error("[BackupScheduler] Initial check failed:", err);
    });
  }, 10 * 1000); // 10 seconds after start
  
  // Periodic polling
  schedulerInterval = setInterval(() => {
    checkAndRunBackup().catch(err => {
      console.error("[BackupScheduler] Periodic check failed:", err);
    });
  }, POLL_INTERVAL_MS);
}

export function stopBackupScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[BackupScheduler] Automatic backup scheduler stopped.");
  }
}

async function checkAndRunBackup(): Promise<void> {
  if (isBackupRunning) {
    console.log("[BackupScheduler] Skip: A backup is currently running.");
    return;
  }

  try {
    const baseUrl = getServerUrlGetter();

    // 1. Fetch settings from Next.js API
    const settingsRes = await fetch(`${baseUrl}/api/backup/settings`);
    if (!settingsRes.ok) throw new Error("Failed to fetch settings");
    const settingsData = await settingsRes.json();
    
    if (!settingsData.success || !settingsData.settings) {
      throw new Error("Invalid settings payload");
    }

    const { autoBackupEnabled, frequency, backupPath } = settingsData.settings;

    if (!autoBackupEnabled || !backupPath || frequency === "manual") {
      console.log(`[BackupScheduler] Skip: autoBackupEnabled=${autoBackupEnabled}, backupPath=${!!backupPath}, frequency=${frequency}`);
      return;
    }

    let thresholdMs = 0;
    if (frequency === "daily") {
      thresholdMs = 24 * 60 * 60 * 1000;
    } else if (frequency === "weekly") {
      thresholdMs = 7 * 24 * 60 * 60 * 1000;
    } else {
      return; 
    }

    // 2. Fetch history from Next.js API
    const historyRes = await fetch(`${baseUrl}/api/backup`);
    if (!historyRes.ok) throw new Error("Failed to fetch history");
    const historyData = await historyRes.json();
    
    if (!historyData.success || !historyData.history) {
      throw new Error("Invalid history payload");
    }

    const history = historyData.history;
    const lastSuccess = history.find((h: any) => h.status === "SUCCESS");
    
    const now = Date.now();
    let shouldRun = false;

    if (!lastSuccess) {
      shouldRun = true;
    } else {
      const timeSinceLast = now - lastSuccess.created_at;
      if (timeSinceLast >= thresholdMs) {
        shouldRun = true;
      }
    }

    if (shouldRun) {
      console.log(`[BackupScheduler] Automatic backup triggered. (Frequency: ${frequency})`);
      isBackupRunning = true;
      
      try {
        const backupRes = await fetch(`${baseUrl}/api/backup`, {
          method: "POST"
        });
        
        if (!backupRes.ok) throw new Error(`API returned ${backupRes.status}`);
        const result = await backupRes.json();
        
        if (result.success) {
          console.log("[BackupScheduler] Automatic backup completed successfully.");
        } else {
          throw new Error(result.error || "Unknown backup error");
        }
      } catch (backupErr) {
        console.error("[BackupScheduler] Automatic backup execution failed:", backupErr);
      } finally {
        isBackupRunning = false;
      }
    } else {
      console.log(`[BackupScheduler] Skip: Not enough time elapsed for ${frequency} backup.`);
    }

  } catch (error) {
    console.error("[BackupScheduler] Error checking backup state:", error);
    isBackupRunning = false; // Reset on check error
  }
}
