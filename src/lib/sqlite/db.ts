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
