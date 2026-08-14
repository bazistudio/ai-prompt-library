import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getDatabasePath } from './manager';

/**
 * Non-destructively migrates existing prompts, prompt_versions, and prompt_tags
 * from the legacy project-root SQLite file (prompt-library.db) into the
 * authoritative AppData SQLite database (prompt_library.db).
 *
 * Leaves the legacy database file completely intact as a backup.
 */
export function migrateLegacyDatabase(targetDb: Database.Database): void {
  const legacyDbPath = path.join(process.cwd(), 'prompt-library.db');
  const targetDbPath = getDatabasePath();

  // If legacy DB does not exist or target DB is identical to legacy DB, skip
  if (!fs.existsSync(legacyDbPath) || path.resolve(legacyDbPath) === path.resolve(targetDbPath)) {
    return;
  }

  console.log(`🔍 [Migration] Checking for legacy data in: ${legacyDbPath}`);

  let legacyDb: Database.Database | null = null;
  try {
    legacyDb = new Database(legacyDbPath, { readonly: true });

    // Check if legacy DB has prompts table
    const tableExists = legacyDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prompts'").get();
    if (!tableExists) {
      console.log('ℹ️ [Migration] Legacy database does not contain prompts table. Migration skipped.');
      return;
    }

    const legacyPrompts = legacyDb.prepare('SELECT * FROM prompts').all() as any[];
    if (legacyPrompts.length === 0) {
      console.log('ℹ️ [Migration] Legacy database has 0 prompts. Migration skipped.');
      return;
    }

    const legacyVersions = legacyDb.prepare('SELECT * FROM prompt_versions').all() as any[];
    const legacyTags = legacyDb.prepare('SELECT * FROM prompt_tags').all() as any[];

    console.log(`📦 [Migration] Found ${legacyPrompts.length} prompts, ${legacyVersions.length} versions, ${legacyTags.length} tags in legacy database.`);

    // Perform transaction to insert missing records into targetDb
    const migrateTx = targetDb.transaction(() => {
      let promptsInserted = 0;
      let versionsInserted = 0;
      let tagsInserted = 0;

      const insertPrompt = targetDb.prepare(`
        INSERT OR IGNORE INTO prompts (id, title, description, category, is_favorite, is_archived, current_version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of legacyPrompts) {
        const res = insertPrompt.run(
          p.id,
          p.title,
          p.description,
          p.category,
          p.is_favorite,
          p.is_archived,
          p.current_version,
          p.created_at,
          p.updated_at
        );
        if (res.changes > 0) promptsInserted++;
      }

      const insertVersion = targetDb.prepare(`
        INSERT OR IGNORE INTO prompt_versions (id, prompt_id, version_number, content, change_summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const v of legacyVersions) {
        const res = insertVersion.run(v.id, v.prompt_id, v.version_number, v.content, v.change_summary, v.created_at);
        if (res.changes > 0) versionsInserted++;
      }

      const insertTag = targetDb.prepare(`
        INSERT OR IGNORE INTO prompt_tags (id, prompt_id, tag_name)
        VALUES (?, ?, ?)
      `);

      for (const t of legacyTags) {
        const res = insertTag.run(t.id, t.prompt_id, t.tag_name);
        if (res.changes > 0) tagsInserted++;
      }

      return { promptsInserted, versionsInserted, tagsInserted };
    });

    const result = migrateTx();
    console.log(`✅ [Migration] Migration complete. Inserted: ${result.promptsInserted} prompts, ${result.versionsInserted} versions, ${result.tagsInserted} tags.`);

    // Verify record count check
    const targetPromptsCount = (targetDb.prepare('SELECT COUNT(*) as count FROM prompts').get() as any).count;
    const targetVersionsCount = (targetDb.prepare('SELECT COUNT(*) as count FROM prompt_versions').get() as any).count;
    const targetTagsCount = (targetDb.prepare('SELECT COUNT(*) as count FROM prompt_tags').get() as any).count;

    console.log(`📊 [Migration Status Report]`);
    console.log(`   Authoritative DB Path: ${targetDbPath}`);
    console.log(`   Prompts Total: ${targetPromptsCount} (Legacy had ${legacyPrompts.length})`);
    console.log(`   Versions Total: ${targetVersionsCount} (Legacy had ${legacyVersions.length})`);
    console.log(`   Tags Total: ${targetTagsCount} (Legacy had ${legacyTags.length})`);
    console.log(`   Legacy backup retained at: ${legacyDbPath}`);
  } catch (err) {
    console.error('❌ [Migration] Error during database migration:', err);
  } finally {
    if (legacyDb) {
      try {
        legacyDb.close();
      } catch (e) {
        // ignore
      }
    }
  }
}
