import { NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { getBackupHistoryDb, deleteBackupRecordDb } from "@/database/local/backupQueries";
import { executeBackup } from "@/services/backup/backupService";
import fs from "fs";

export async function GET() {
  try {
    const db = getSQLiteDB();
    const history = getBackupHistoryDb(db);
    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("[Backup GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await executeBackup();
    return NextResponse.json({ success: true, backup: result });
  } catch (error: any) {
    console.error("[Backup POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing backup id" }, { status: 400 });
    }

    const db = getSQLiteDB();
    // Verify it exists in DB first
    const history = getBackupHistoryDb(db);
    const record = history.find((h) => h.id === id);

    if (!record) {
      return NextResponse.json({ success: false, error: "Backup record not found" }, { status: 404 });
    }

    // Delete file if it exists and is successful
    if (record.status === "SUCCESS" && record.file_path && fs.existsSync(record.file_path)) {
      try {
        fs.unlinkSync(record.file_path);
      } catch (err) {
        console.error("Failed to delete backup file:", err);
      }
    }

    deleteBackupRecordDb(db, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Backup DELETE]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
