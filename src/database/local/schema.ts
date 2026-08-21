import type { Database } from 'better-sqlite3';

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

  // 5. App Settings, Dynamic Categories & Workspaces/Projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT 'folder',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
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

  // Add project_id column to prompts if missing
  try {
    db.exec(`ALTER TABLE prompts ADD COLUMN project_id TEXT DEFAULT 'proj_default';`);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
      console.warn(`[DB] Migration warn: Could not add project_id to prompts:`, err);
    }
  }

  // Add text_direction and language columns to prompts if missing (additive, safe)
  try {
    db.exec(`ALTER TABLE prompts ADD COLUMN text_direction TEXT DEFAULT 'auto';`);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
      console.warn(`[DB] Migration warn: Could not add text_direction to prompts:`, err);
    }
  }

  try {
    db.exec(`ALTER TABLE prompts ADD COLUMN language TEXT DEFAULT 'auto';`);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
      console.warn(`[DB] Migration warn: Could not add language to prompts:`, err);
    }
  }

  // Add usage_count and last_used_at columns to prompts (Phase B1 - additive, safe)
  try {
    db.exec(`ALTER TABLE prompts ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;`);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
      console.warn(`[DB] Migration warn: Could not add usage_count to prompts:`, err);
    }
  }

  try {
    db.exec(`ALTER TABLE prompts ADD COLUMN last_used_at INTEGER;`);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('duplicate column name')) {
      console.warn(`[DB] Migration warn: Could not add last_used_at to prompts:`, err);
    }
  }

  // Indexes for categories & projects
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);`);

  // Seed default workspace/project if table is empty
  const projectCount = (db.prepare(`SELECT COUNT(*) as count FROM projects`).get() as { count: number }).count;
  if (projectCount === 0) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO projects (id, name, description, color, icon, sort_order, is_default, created_at, updated_at)
      VALUES ('proj_default', 'General Workspace', 'Default prompt engineering workspace', '#6366f1', 'folder', 1, 1, ?, ?)
    `).run(now, now);
  }

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

  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);`);

  // 7. Workflows & Sequential Chains (Phase 7)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'General',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'gemini',
      model TEXT NOT NULL DEFAULT 'gemini-3.7-flash',
      prompt_content TEXT NOT NULL,
      system_instruction TEXT,
      temperature REAL DEFAULT 0.7,
      max_tokens INTEGER DEFAULT 2048,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);`);

  // 8. Evaluation Test Suites (Phase 7)
  db.exec(`
    CREATE TABLE IF NOT EXISTS eval_suites (
      id TEXT PRIMARY KEY,
      prompt_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      test_cases TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 9. Backup History (Phase B2-B)
  db.exec(`
    CREATE TABLE IF NOT EXISTS backup_history (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL,
      backup_type TEXT NOT NULL,
      error_message TEXT,
      checksum TEXT
    );
  `);
}
