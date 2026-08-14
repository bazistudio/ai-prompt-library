import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { renameCategoryDb } from "@/database/local/categoryQueries";
import { getSettingDb, SETTING_KEYS } from "@/database/local/settingsQueries";
import { renameCategoryFolder } from "../../../../../electron/fileStorageManager";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getSQLiteDB();
    const res = renameCategoryDb(db, id, body.name);

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.error }, { status: 400 });
    }

    if (res.oldFolderName && res.newFolderName) {
      const storagePath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
      if (storagePath) {
        await renameCategoryFolder(storagePath, res.oldFolderName, res.newFolderName);
      }
    }

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("PATCH /api/categories/[id] error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
