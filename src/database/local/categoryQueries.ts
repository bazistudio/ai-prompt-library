import { Database } from "better-sqlite3";
import { v7 as uuidv7 } from "uuid";

export interface CategoryItem {
  id: string;
  name: string;
  folder_name: string;
  sort_order: number;
  is_default: boolean;
  created_at: number;
  updated_at: number;
}

const RESERVED_WINDOWS_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
]);

const INVALID_CHARS_REGEX = /[\\/:\*\?"<>\|]/;

export function validateCategoryName(name: string): { valid: boolean; error?: string; cleanName?: string } {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Category name cannot be empty." };
  }

  const clean = name.trim().replace(/[\. ]+$/, ""); // Remove trailing periods/spaces for Windows folder safety

  if (!clean) {
    return { valid: false, error: "Category name cannot be empty or whitespace only." };
  }

  if (clean.length > 100) {
    return { valid: false, error: "Category name is too long (maximum 100 characters)." };
  }

  if (INVALID_CHARS_REGEX.test(clean)) {
    return { valid: false, error: "Category name contains invalid folder characters (\\ / : * ? \" < > |)." };
  }

  if (RESERVED_WINDOWS_NAMES.has(clean.toUpperCase())) {
    return { valid: false, error: `"${clean}" is a reserved Windows system name.` };
  }

  return { valid: true, cleanName: clean };
}

export function getAllCategoriesDb(db: Database): CategoryItem[] {
  const stmt = db.prepare(`
    SELECT id, name, folder_name, sort_order, is_default, created_at, updated_at
    FROM categories
    ORDER BY sort_order ASC, name ASC
  `);
  const rows = stmt.all() as any[];
  return rows.map((r) => ({
    ...r,
    is_default: r.is_default === 1,
  }));
}

export function getCategoryByIdDb(db: Database, id: string): CategoryItem | null {
  const stmt = db.prepare(`
    SELECT id, name, folder_name, sort_order, is_default, created_at, updated_at
    FROM categories
    WHERE id = ?
  `);
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    ...row,
    is_default: row.is_default === 1,
  };
}

export function getCategoryByNameDb(db: Database, name: string): CategoryItem | null {
  const stmt = db.prepare(`
    SELECT id, name, folder_name, sort_order, is_default, created_at, updated_at
    FROM categories
    WHERE LOWER(name) = LOWER(?)
  `);
  const row = stmt.get(name.trim()) as any;
  if (!row) return null;
  return {
    ...row,
    is_default: row.is_default === 1,
  };
}

export function createCategoryDb(
  db: Database,
  name: string
): { success: boolean; category?: CategoryItem; error?: string } {
  const val = validateCategoryName(name);
  if (!val.valid || !val.cleanName) {
    return { success: false, error: val.error };
  }
  const cleanName = val.cleanName;

  const existing = getCategoryByNameDb(db, cleanName);
  if (existing) {
    return { success: false, error: "A category with this name already exists." };
  }

  const now = Date.now();
  const id = `cat_${uuidv7().replace(/-/g, "").slice(0, 12)}`;

  const maxSortStmt = db.prepare(`SELECT MAX(sort_order) as maxSort FROM categories`);
  const maxRow = maxSortStmt.get() as { maxSort: number | null };
  const sortOrder = (maxRow?.maxSort || 0) + 1;

  const stmt = db.prepare(`
    INSERT INTO categories (id, name, folder_name, sort_order, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `);
  stmt.run(id, cleanName, cleanName, sortOrder, now, now);

  const newCat = getCategoryByIdDb(db, id);
  return { success: true, category: newCat! };
}

export function renameCategoryDb(
  db: Database,
  id: string,
  newName: string
): { success: boolean; category?: CategoryItem; oldFolderName?: string; newFolderName?: string; error?: string } {
  const existing = getCategoryByIdDb(db, id);
  if (!existing) {
    return { success: false, error: "Category not found." };
  }

  const val = validateCategoryName(newName);
  if (!val.valid || !val.cleanName) {
    return { success: false, error: val.error };
  }
  const cleanName = val.cleanName;

  if (existing.name.toLowerCase() === cleanName.toLowerCase()) {
    // No change needed
    return { success: true, category: existing, oldFolderName: existing.folder_name, newFolderName: existing.folder_name };
  }

  const duplicate = getCategoryByNameDb(db, cleanName);
  if (duplicate && duplicate.id !== id) {
    return { success: false, error: "A category with this name already exists." };
  }

  const oldFolderName = existing.folder_name;
  const newFolderName = cleanName;
  const now = Date.now();

  // IMPORTANT ARCHITECTURAL REQUIREMENT:
  // Prompts reference category_id. We ONLY update categories.name and categories.folder_name.
  // Prompt rows in SQLite remain unchanged.
  const stmt = db.prepare(`
    UPDATE categories
    SET name = ?, folder_name = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(cleanName, newFolderName, now, id);

  const updatedCat = getCategoryByIdDb(db, id);
  return {
    success: true,
    category: updatedCat!,
    oldFolderName,
    newFolderName,
  };
}
