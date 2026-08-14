import { Database } from 'better-sqlite3';
import { logger } from '../logger';

export function initializeSchema(db: Database) {
  // We use execute because these are DDL statements.
  
  // 1. Core Data Entities
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      updatedAt INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      items TEXT NOT NULL,
      paymentMethod TEXT,
      discount REAL,
      updatedAt INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Simple migrations for existing DBs that were created before these columns were added
  const newColumns = [
    'customerId TEXT',
    'items TEXT',
    'paymentMethod TEXT',
    'discount REAL'
  ];

  for (const col of newColumns) {
    try {
      db.exec(`ALTER TABLE orders ADD COLUMN ${col};`);
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
        logger.warn(`[DB] Migration warn: Could not add ${col} to orders:`, err);
      }
    }
  }

  // 2. Sync Queue (Pending mutations)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY, -- Same as operation_log ID for tracing
      entity_type TEXT NOT NULL,
      operation TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
      payload TEXT NOT NULL, -- JSON
      timestamp INTEGER NOT NULL
    );
  `);

  // 3. Operation Log (Audit trail)
  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT NOT NULL -- 'pending', 'synced', 'failed'
    );
  `);
  // 4. Offline Core Prompt Library Entities
  db.exec(`
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
  `);

  db.exec(`
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
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_tags (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      FOREIGN KEY(prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
      UNIQUE(prompt_id, tag_name)
    );
  `);

  // Prompt Indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);`);

  // 5. Audit Log (Security & Tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      shop_id TEXT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      metadata TEXT
    );
  `);
}
