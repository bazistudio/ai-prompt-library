import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { env } from "@/config/env";

const DB_PATH = env.SQLITE_DB_PATH ? path.resolve(env.SQLITE_DB_PATH) : path.join(process.cwd(), "prompt-library.db");

let dbInstance: Database.Database | null = null;

export function getSQLiteDB(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    dbInstance = new Database(DB_PATH, { verbose: console.log });

    dbInstance.pragma("journal_mode = WAL");

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS system_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checked_at TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'Other',
        is_favorite INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        current_version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS prompt_versions (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        change_summary TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
        UNIQUE(prompt_id, version_number)
      );

      CREATE TABLE IF NOT EXISTS prompt_tags (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        FOREIGN KEY(prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
        UNIQUE(prompt_id, tag_name)
      );

      CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
      CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at);
      CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
    `);

    const insert = dbInstance.prepare("INSERT INTO system_checks (checked_at, status) VALUES (?, ?)");
    insert.run(new Date().toISOString(), "boilerplate_init");

    console.log(`💾 SQLite database initialized at: ${DB_PATH}`);
  } catch (error) {
    console.error("❌ Failed to initialize SQLite database:", error);
    throw error;
  }

  return dbInstance;
}
