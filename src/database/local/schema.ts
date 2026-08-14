import { Database } from 'better-sqlite3';

export function initializeSchema(db: Database) {
  // 1. Core Data Entities & System Health
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checked_at TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

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
        console.warn(`[DB] Migration warn: Could not add ${col} to orders:`, err);
      }
    }
  }

  // 2. Sync Queue (Pending mutations)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
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
      status TEXT NOT NULL
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

  // 5. App Settings & Dynamic Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      folder_name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Add category_id column to prompts if missing
  try {
    db.exec(`ALTER TABLE prompts ADD COLUMN category_id TEXT;`);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
      console.warn(`[DB] Migration warn: Could not add category_id to prompts:`, err);
    }
  }

  // Index for categories
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);`);

  // Seed default categories if table is empty
  const catCount = (db.prepare(`SELECT COUNT(*) as count FROM categories`).get() as { count: number }).count;
  if (catCount === 0) {
    const now = Date.now();
    const defaults = [
      { id: "cat_coding", name: "Coding", folderName: "Coding", sortOrder: 1 },
      { id: "cat_marketing", name: "Marketing", folderName: "Marketing", sortOrder: 2 },
      { id: "cat_writing", name: "Writing", folderName: "Writing", sortOrder: 3 },
      { id: "cat_business", name: "Business", folderName: "Business", sortOrder: 4 },
      { id: "cat_youtube", name: "YouTube", folderName: "YouTube", sortOrder: 5 },
      { id: "cat_ai", name: "AI", folderName: "AI", sortOrder: 6 },
      { id: "cat_productivity", name: "Productivity", folderName: "Productivity", sortOrder: 7 },
      { id: "cat_other", name: "Other", folderName: "Other", sortOrder: 8 },
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, folder_name, sort_order, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `);

    for (const c of defaults) {
      insertCat.run(c.id, c.name, c.folderName, c.sortOrder, now, now);
    }
  }

  // 6. Audit Log (Security & Tracking)
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
