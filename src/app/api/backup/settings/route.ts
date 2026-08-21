import { NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { getSettingDb, setSettingDb, SETTING_KEYS } from "@/database/local/settingsQueries";

export async function GET() {
  try {
    const db = getSQLiteDB();
    const autoEnabled = getSettingDb(db, SETTING_KEYS.BACKUP_AUTO_ENABLED);
    const frequency = getSettingDb(db, SETTING_KEYS.BACKUP_FREQUENCY);
    const retention = getSettingDb(db, SETTING_KEYS.BACKUP_RETENTION_COUNT);
    const location = getSettingDb(db, SETTING_KEYS.BACKUP_LOCATION);

    return NextResponse.json({
      success: true,
      settings: {
        autoBackupEnabled: autoEnabled === "true" || autoEnabled === null, // default true
        frequency: frequency || "daily",
        retentionCount: retention || "7",
        backupPath: location || null,
      },
    });
  } catch (error: any) {
    console.error("[Backup Settings GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getSQLiteDB();

    if (body.autoBackupEnabled !== undefined) {
      setSettingDb(db, SETTING_KEYS.BACKUP_AUTO_ENABLED, String(body.autoBackupEnabled));
    }
    if (body.frequency !== undefined) {
      setSettingDb(db, SETTING_KEYS.BACKUP_FREQUENCY, body.frequency);
    }
    if (body.retentionCount !== undefined) {
      setSettingDb(db, SETTING_KEYS.BACKUP_RETENTION_COUNT, body.retentionCount);
    }
    if (body.backupPath !== undefined) {
      setSettingDb(db, SETTING_KEYS.BACKUP_LOCATION, body.backupPath);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Backup Settings POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
