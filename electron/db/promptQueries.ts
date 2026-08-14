import { Database } from 'better-sqlite3';
import { v7 as uuidv7 } from 'uuid';

export interface CreatePromptPayload {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
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
  tags?: string[];
}

export interface GetPromptsOptions {
  category?: string;
  search?: string;
  favoriteOnly?: boolean;
}

/** Normalize tags (trim & lowercase deduplication) */
function normalizeTags(tags?: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  const set = new Set<string>();
  for (const t of tags) {
    if (typeof t === 'string') {
      const clean = t.trim().toLowerCase();
      if (clean) set.add(clean);
    }
  }
  return Array.from(set);
}

export function createPromptDb(db: Database, payload: CreatePromptPayload) {
  const promptId = uuidv7();
  const versionId = uuidv7();
  const now = Date.now();
  const title = (payload.title || 'Untitled Prompt').trim();
  const description = (payload.description || '').trim();
  const category = (payload.category || 'Other').trim();
  const content = (payload.content || '').trim();
  const tags = normalizeTags(payload.tags);

  const tx = db.transaction(() => {
    // 1. Insert prompt record
    const insertPrompt = db.prepare(`
      INSERT INTO prompts (id, title, description, category, is_favorite, is_archived, current_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, 0, 1, ?, ?)
    `);
    insertPrompt.run(promptId, title, description, category, now, now);

    // 2. Insert initial version (v1)
    const insertVersion = db.prepare(`
      INSERT INTO prompt_versions (id, prompt_id, version_number, content, change_summary, created_at)
      VALUES (?, ?, 1, ?, 'Initial version (v1)', ?)
    `);
    insertVersion.run(versionId, promptId, content, now);

    // 3. Insert tags
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
  console.log(`[DB] Created prompt: ${promptId} (${title}) v1`);
  return { success: true, promptId };
}

export function addPromptVersionDb(db: Database, payload: AddVersionPayload) {
  const { promptId, content, changeSummary } = payload;
  const now = Date.now();

  const tx = db.transaction(() => {
    // 1. Get max version number for this prompt
    const verStmt = db.prepare(`
      SELECT MAX(version_number) as maxVer FROM prompt_versions WHERE prompt_id = ?
    `);
    const row = verStmt.get(promptId) as { maxVer: number | null };
    const nextVer = (row && row.maxVer ? row.maxVer : 0) + 1;

    // 2. Insert new immutable version
    const insertVer = db.prepare(`
      INSERT INTO prompt_versions (id, prompt_id, version_number, content, change_summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const versionId = uuidv7();
    insertVer.run(versionId, promptId, nextVer, (content || '').trim(), (changeSummary || `Version v${nextVer}`).trim(), now);

    // 3. Update prompt current_version and updated_at
    const updatePrompt = db.prepare(`
      UPDATE prompts SET current_version = ?, updated_at = ? WHERE id = ?
    `);
    updatePrompt.run(nextVer, now, promptId);

    return nextVer;
  });

  const nextVer = tx();
  console.log(`[DB] Created version v${nextVer} for prompt ${promptId}`);
  return { success: true, versionNumber: nextVer };
}

export function updatePromptMetaDb(db: Database, payload: UpdateMetaPayload) {
  const { promptId, title, description, category, tags } = payload;
  const now = Date.now();

  const tx = db.transaction(() => {
    const fields: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description.trim());
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category.trim());
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      params.push(now);
      params.push(promptId);

      const sql = `UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`;
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

export function deletePromptDb(db: Database, promptId: string) {
  const stmt = db.prepare(`DELETE FROM prompts WHERE id = ?`);
  stmt.run(promptId);
  return { success: true };
}

export function getPromptsDb(db: Database, options: GetPromptsOptions = {}) {
  let query = `
    SELECT 
      p.id, p.title, p.description, p.category, p.is_favorite, p.is_archived,
      p.current_version, p.created_at, p.updated_at,
      pv.content as current_content
    FROM prompts p
    LEFT JOIN prompt_versions pv ON p.id = pv.prompt_id AND p.current_version = pv.version_number
    WHERE p.is_archived = 0
  `;
  const params: any[] = [];

  if (options.category && options.category !== 'All') {
    query += ` AND p.category = ?`;
    params.push(options.category);
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

  // Fetch tags for each prompt
  const tagStmt = db.prepare(`SELECT tag_name FROM prompt_tags WHERE prompt_id = ?`);
  return prompts.map(p => {
    const tagsRows = tagStmt.all(p.id) as { tag_name: string }[];
    return {
      ...p,
      is_favorite: p.is_favorite === 1,
      is_archived: p.is_archived === 1,
      tags: tagsRows.map(t => t.tag_name)
    };
  });
}

export function getPromptByIdDb(db: Database, promptId: string) {
  const pStmt = db.prepare(`SELECT * FROM prompts WHERE id = ?`);
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
    tags: tagsRows.map(t => t.tag_name),
    versions
  };
}
