import { ipcMain } from "electron";
import { getDatabase } from "../src/database/local/manager";
import {
  verifyLicenseCertificate,
  DEFAULT_FREE_LICENSE,
  LicenseInfo,
} from "../src/services/licensing/licenseVerifier";

export function getStoredLicenseInfo(): LicenseInfo {
  try {
    const db = getDatabase();
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'license_data'").get() as { value: string } | undefined;
    if (!row || !row.value) {
      return DEFAULT_FREE_LICENSE;
    }
    const verification = verifyLicenseCertificate(row.value);
    return verification.info;
  } catch (err) {
    console.error("[LicenseManager] Error reading license:", err);
    return DEFAULT_FREE_LICENSE;
  }
}

export function initializeLicenseManager(): void {
  ipcMain.handle("license:getStatus", async () => {
    return getStoredLicenseInfo();
  });

  ipcMain.handle("license:activate", async (_event, rawKey: string) => {
    try {
      if (!rawKey || typeof rawKey !== "string" || !rawKey.trim()) {
        return { success: false, error: "License key is required." };
      }

      const verification = verifyLicenseCertificate(rawKey);
      if (!verification.valid || verification.info.status === "INVALID") {
        return {
          success: false,
          error: verification.error || "Invalid cryptographic license signature.",
        };
      }

      if (verification.info.status === "EXPIRED") {
        return {
          success: false,
          error: "This commercial license key has expired.",
        };
      }

      // Persist in SQLite app_settings
      const db = getDatabase();
      const now = Date.now();
      db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('license_data', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(rawKey.trim(), now);

      console.log(`[LicenseManager] License successfully activated for edition: ${verification.info.edition}`);
      return { success: true, license: verification.info };
    } catch (err: any) {
      console.error("[LicenseManager] Activation error:", err);
      return { success: false, error: err.message || "Failed to activate license." };
    }
  });

  ipcMain.handle("license:deactivate", async () => {
    try {
      const db = getDatabase();
      db.prepare("DELETE FROM app_settings WHERE key = 'license_data'").run();
      console.log("[LicenseManager] License deactivated and reverted to Free tier.");
      return { success: true, license: DEFAULT_FREE_LICENSE };
    } catch (err: any) {
      console.error("[LicenseManager] Deactivation error:", err);
      return { success: false, error: err.message || "Failed to remove license." };
    }
  });
}
