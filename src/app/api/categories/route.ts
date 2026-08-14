import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { getAllCategoriesDb, createCategoryDb } from "@/database/local/categoryQueries";
import { getSettingDb, SETTING_KEYS } from "@/database/local/settingsQueries";
import { ensureCategoryFolders } from "../../../../electron/fileStorageManager";

export async function GET() {
  try {
    const db = getSQLiteDB();
    const categories = getAllCategoriesDb(db);
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getSQLiteDB();
    const res = createCategoryDb(db, body.name);
    if (!res.success) {
      return NextResponse.json({ success: false, message: res.error }, { status: 400 });
    }

    const storagePath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
    if (storagePath) {
      const categories = getAllCategoriesDb(db);
      await ensureCategoryFolders(storagePath, categories);
    }

    return NextResponse.json(res, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
