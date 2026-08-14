import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSQLiteDB } from "@/database/local/db";
import { getSettingDb, setSettingDb, SETTING_KEYS } from "@/database/local/settingsQueries";
import { getAllCategoriesDb } from "@/database/local/categoryQueries";
import { ensureCategoryFolders, moveLibrary } from "../../../../electron/fileStorageManager";

export async function GET() {
  try {
    const db = getSQLiteDB();
    const storagePath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
    return NextResponse.json({ success: true, storagePath });
  } catch (error: any) {
    console.error("GET /api/storage error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPath = body.storagePath;
    const db = getSQLiteDB();
    const categories = getAllCategoriesDb(db);

    if (newPath && typeof newPath === "string") {
      const cleanNewPath = path.resolve(newPath);

      if (body.action === "move" || body.move === true) {
        const oldPath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
        if (oldPath && oldPath !== cleanNewPath) {
          const moveRes = await moveLibrary(oldPath, cleanNewPath, categories);
          if (!moveRes.success) {
            return NextResponse.json({ success: false, error: moveRes.error }, { status: 400 });
          }
        } else {
          await ensureCategoryFolders(cleanNewPath, categories);
        }
      } else {
        await ensureCategoryFolders(cleanNewPath, categories);
      }

      setSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH, cleanNewPath);
      return NextResponse.json({ success: true, storagePath: cleanNewPath });
    } else {
      setSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH, null);
      return NextResponse.json({ success: true, storagePath: null });
    }
  } catch (error: any) {
    console.error("POST /api/storage error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
