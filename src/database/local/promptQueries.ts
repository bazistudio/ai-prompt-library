import { Database } from 'better-sqlite3';
import { v7 as uuidv7 } from 'uuid';
import { savePromptFile } from '../../../electron/fileStorageManager';

export interface CreatePromptPayload {
  title: string;
  description?: string;
  category?: string;
  categoryId?: string;
  projectId?: string;
  tags?: string[];
  content: string;
  textDirection?: "ltr" | "rtl" | "auto";
  language?: string;
}

export interface AddVersionPayload {
  promptId: string;
  content: string;
  changeSummary?: string;
}

export interface UpdateMetaPayload {
  promptId: string;
  title?: string;
  description?: string;
  category?: string;
  categoryId?: string;
  projectId?: string;
  tags?: string[];
  textDirection?: "ltr" | "rtl" | "auto";
  language?: string;
}

export interface GetPromptsOptions {
  category?: string;
  categoryId?: string;
  projectId?: string;
  search?: string;
  favoriteOnly?: boolean;
}

/** Normalize tags (trim & lowercase deduplication) */
function normalizeTags(tags?: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  const set = new Set<string>();
  for (const t of tags) {
    if (typeof t === "string") {
      const clean = t.trim().toLowerCase();
      if (clean) set.add(clean);
    }
  }
  return Array.from(set);
}

/** Helper to resolve category ID and display name from payload or DB (Strict: No fallback to "Other") */
function resolveCategoryInfo(db: Database, inputId?: string, inputName?: string) {
  if (inputId) {
    const cat = db.prepare(`SELECT id, name, folder_name FROM categories WHERE id = ?`).get(inputId) as any;
    if (cat) return { id: cat.id, name: cat.name, folderName: cat.folder_name };
  }
  if (inputName) {
    const cat = db.prepare(`SELECT id, name, folder_name FROM categories WHERE LOWER(name) = LOWER(?)`).get(inputName.trim()) as any;
    if (cat) return { id: cat.id, name: cat.name, folderName: cat.folder_name };
  }
  return null;
}

export async function createPromptDb(db: Database, payload: CreatePromptPayload, storagePath: string | null) {
  // Rule 1: No storage path -> DO NOT complete save
  if (!storagePath || !storagePath.trim()) {
    return { success: false, error: "Prompt library storage location is not configured." };
  }

  // Rule 2: Strict category resolution -> No fallback to "Other"
  const catInfo = resolveCategoryInfo(db, payload.categoryId, payload.category);
  if (!catInfo || !catInfo.folderName) {
    return { success: false, error: `Category folder could not be resolved for category "${payload.category || payload.categoryId}".` };
  }

  const promptId = uuidv7();
  const versionId = uuidv7();
  const now = Date.now();
  const title = (payload.title || "Untitled Prompt").trim();
  const description = (payload.description || "").trim();
  const content = (payload.content || "").trim();
  const tags = normalizeTags(payload.tags);

  // Rule 3: Write Markdown file to disk BEFORE committing SQLite transaction!
  const fileRes = await savePromptFile(storagePath, catInfo.folderName, promptId, title, content);
  if (!fileRes.success) {
    return { success: false, error: fileRes.error || "Failed to write prompt file to disk." };
  }

  const tx = db.transaction(() => {
    const insertPrompt = db.prepare(`
      INSERT INTO prompts (id, title, description, category, category_id, project_id, is_favorite, is_archived, current_version, text_direction, language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?, ?)
    `);
    const direction = payload.textDirection || "auto";
    const lang = payload.language || "auto";
    const projId = payload.projectId || "proj_default";
    insertPrompt.run(promptId, title, description, catInfo.name, catInfo.id, projId, direction, lang, now, now);

    const insertVersion = db.prepare(`
      INSERT INTO prompt_versions (id, prompt_id, version_number, content, change_summary, created_at)
      VALUES (?, ?, 1, ?, 'Initial version (v1)', ?)
    `);
    insertVersion.run(versionId, promptId, content, now);

    if (tags.length > 0) {
      const insertTag = db.prepare(`
        INSERT OR IGNORE INTO prompt_tags (id, prompt_id, tag_name)
        VALUES (?, ?, ?)
      `);
      for (const tag of tags) {
        insertTag.run(uuidv7(), promptId, tag);
      }
    }
  });

  tx();
  console.log(`[DB] Created prompt: ${promptId} (${title}) v1 at ${fileRes.filePath}`);
  return { success: true, promptId, categoryId: catInfo.id, categoryName: catInfo.name, categoryFolderName: catInfo.folderName, filePath: fileRes.filePath };
}

export async function addPromptVersionDb(db: Database, payload: AddVersionPayload, storagePath: string | null) {
  // Rule 1: No storage path -> DO NOT complete save
  if (!storagePath || !storagePath.trim()) {
    return { success: false, error: "Prompt library storage location is not configured." };
  }

  const { promptId, content, changeSummary } = payload;

  const prompt = db.prepare(`
    SELECT p.id, p.title, COALESCE(c.folder_name, p.category) as folder_name
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(promptId) as { id: string; title: string; folder_name: string | null } | undefined;

  if (!prompt) {
    return { success: false, error: "Prompt not found." };
  }

  // Rule 2: Strict category resolution -> No fallback to "Other"
  if (!prompt.folder_name || !prompt.folder_name.trim()) {
    return { success: false, error: "Category folder could not be resolved for this prompt." };
  }

  // Rule 3: Write Markdown file to disk BEFORE committing SQLite transaction!
  const fileRes = await savePromptFile(storagePath, prompt.folder_name, prompt.id, prompt.title, content || "");
  if (!fileRes.success) {
    return { success: false, error: fileRes.error || "Failed to write prompt file to disk." };
  }

  const now = Date.now();
  const tx = db.transaction(() => {
    const verStmt = db.prepare(`
      SELECT MAX(version_number) as maxVer FROM prompt_versions WHERE prompt_id = ?
    `);
    const row = verStmt.get(promptId) as { maxVer: number | null };
    const nextVer = (row && row.maxVer ? row.maxVer : 0) + 1;

    const insertVer = db.prepare(`
      INSERT INTO prompt_versions (id, prompt_id, version_number, content, change_summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const versionId = uuidv7();
    insertVer.run(versionId, promptId, nextVer, (content || "").trim(), (changeSummary || `Version v${nextVer}`).trim(), now);

    const updatePrompt = db.prepare(`
      UPDATE prompts SET current_version = ?, updated_at = ? WHERE id = ?
    `);
    updatePrompt.run(nextVer, now, promptId);

    return nextVer;
  });

  const nextVer = tx();
  console.log(`[DB] Created version v${nextVer} for prompt ${promptId} at ${fileRes.filePath}`);
  return { success: true, versionNumber: nextVer };
}

export function updatePromptMetaDb(db: Database, payload: UpdateMetaPayload) {
  const { promptId, title, description, category, categoryId, projectId, tags, textDirection, language } = payload;
  const now = Date.now();

  const tx = db.transaction(() => {
    const fields: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      fields.push("title = ?");
      params.push(title.trim());
    }
    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description.trim());
    }
    if (projectId !== undefined) {
      fields.push("project_id = ?");
      params.push(projectId);
    }
    if (textDirection !== undefined) {
      fields.push("text_direction = ?");
      params.push(textDirection);
    }
    if (language !== undefined) {
      fields.push("language = ?");
      params.push(language);
    }
    if (categoryId !== undefined || category !== undefined) {
      const catInfo = resolveCategoryInfo(db, categoryId, category);
      if (catInfo) {
        fields.push("category = ?");
        params.push(catInfo.name);
        fields.push("category_id = ?");
        params.push(catInfo.id);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = ?");
      params.push(now);
      params.push(promptId);

      const sql = `UPDATE prompts SET ${fields.join(", ")} WHERE id = ?`;
      db.prepare(sql).run(...params);
    }

    if (tags !== undefined) {
      db.prepare(`DELETE FROM prompt_tags WHERE prompt_id = ?`).run(promptId);
      const cleanTags = normalizeTags(tags);
      if (cleanTags.length > 0) {
        const insertTag = db.prepare(`
          INSERT OR IGNORE INTO prompt_tags (id, prompt_id, tag_name)
          VALUES (?, ?, ?)
        `);
        for (const tag of cleanTags) {
          insertTag.run(uuidv7(), promptId, tag);
        }
      }
    }
  });

  tx();
  return { success: true };
}

export function toggleFavoriteDb(db: Database, promptId: string) {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE prompts SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(now, promptId);

  const getStmt = db.prepare(`SELECT is_favorite FROM prompts WHERE id = ?`);
  const row = getStmt.get(promptId) as { is_favorite: number } | undefined;
  return { success: true, is_favorite: row ? row.is_favorite === 1 : false };
}

export function incrementPromptUsageDb(db: Database, promptId: string) {
  const now = Date.now();
  db.prepare(`
    UPDATE prompts 
    SET usage_count = usage_count + 1, last_used_at = ? 
    WHERE id = ?
  `).run(now, promptId);
  return { success: true };
}

export function deletePromptDb(db: Database, promptId: string) {
  const stmt = db.prepare(`DELETE FROM prompts WHERE id = ?`);
  stmt.run(promptId);
  return { success: true };
}

export function getPromptsDb(db: Database, options: GetPromptsOptions = {}) {
  let query = `
    SELECT 
      p.id, p.title, p.description, p.is_favorite, p.is_archived,
      p.current_version, p.created_at, p.updated_at,
      p.category_id,
      p.project_id,
      p.text_direction,
      p.language,
      COALESCE(c.name, p.category) as category,
      COALESCE(c.folder_name, p.category) as category_folder_name,
      COALESCE(pr.name, 'General Workspace') as project_name,
      COALESCE(pr.color, '#6366f1') as project_color,
      pv.content as current_content
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN projects pr ON p.project_id = pr.id
    LEFT JOIN prompt_versions pv ON p.id = pv.prompt_id AND p.current_version = pv.version_number
    WHERE p.is_archived = 0
  `;
  const params: any[] = [];

  if (options.projectId) {
    query += ` AND p.project_id = ?`;
    params.push(options.projectId);
  }

  if (options.categoryId) {
    query += ` AND p.category_id = ?`;
    params.push(options.categoryId);
  } else if (options.category && options.category !== "All") {
    query += ` AND (p.category_id = ? OR LOWER(c.name) = LOWER(?) OR LOWER(p.category) = LOWER(?))`;
    // Find category ID if exists
    const cat = db.prepare(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?)`).get(options.category.trim()) as { id: string } | undefined;
    const catId = cat ? cat.id : "";
    params.push(catId, options.category.trim(), options.category.trim());
  }

  if (options.favoriteOnly) {
    query += ` AND p.is_favorite = 1`;
  }

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query += ` AND (p.title LIKE ? OR p.description LIKE ? OR pv.content LIKE ?)`;
    params.push(term, term, term);
  }

  query += ` ORDER BY p.updated_at DESC`;

  const prompts = db.prepare(query).all(...params) as any[];

  const tagStmt = db.prepare(`SELECT tag_name FROM prompt_tags WHERE prompt_id = ?`);
  return prompts.map((p) => {
    const tagsRows = tagStmt.all(p.id) as { tag_name: string }[];
    return {
      ...p,
      is_favorite: p.is_favorite === 1,
      is_archived: p.is_archived === 1,
      tags: tagsRows.map((t) => t.tag_name),
    };
  });
}

export function getPromptByIdDb(db: Database, promptId: string) {
  const pStmt = db.prepare(`
    SELECT 
      p.*,
      COALESCE(c.name, p.category) as category,
      COALESCE(c.folder_name, p.category) as category_folder_name,
      COALESCE(pr.name, 'General Workspace') as project_name,
      COALESCE(pr.color, '#6366f1') as project_color
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN projects pr ON p.project_id = pr.id
    WHERE p.id = ?
  `);
  const prompt = pStmt.get(promptId) as any;

  if (!prompt) return null;

  const verStmt = db.prepare(`
    SELECT id, version_number, content, change_summary, created_at 
    FROM prompt_versions 
    WHERE prompt_id = ? 
    ORDER BY version_number ASC
  `);
  const versions = verStmt.all(promptId) as any[];

  const tagStmt = db.prepare(`SELECT tag_name FROM prompt_tags WHERE prompt_id = ?`);
  const tagsRows = tagStmt.all(promptId) as { tag_name: string }[];

  return {
    ...prompt,
    is_favorite: prompt.is_favorite === 1,
    is_archived: prompt.is_archived === 1,
    tags: tagsRows.map((t) => t.tag_name),
    versions,
  };
}

export function getPromptStatsDb(db: Database) {
  const totalPrompts = (db.prepare(`SELECT COUNT(*) as count FROM prompts WHERE is_archived = 0`).get() as any)?.count || 0;
  const favoritePrompts = (db.prepare(`SELECT COUNT(*) as count FROM prompts WHERE is_favorite = 1 AND is_archived = 0`).get() as any)?.count || 0;
  const totalCategories = (db.prepare(`SELECT COUNT(*) as count FROM categories`).get() as any)?.count || 0;
  const totalVersions = (db.prepare(`SELECT COUNT(*) as count FROM prompt_versions`).get() as any)?.count || 0;

  const recentPrompts = db.prepare(`
    SELECT 
      p.id, p.title, p.description, p.current_version, p.is_favorite, p.updated_at,
      COALESCE(c.name, p.category) as category
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_archived = 0
    ORDER BY p.updated_at DESC
    LIMIT 5
  `).all() as any[];

  return {
    totalPrompts,
    favoritePrompts,
    totalCategories,
    totalVersions,
    recentPrompts: recentPrompts.map((p) => ({
      ...p,
      is_favorite: p.is_favorite === 1,
    })),
  };
}
