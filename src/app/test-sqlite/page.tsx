import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export default async function TestSqlitePage() {
  let status = "INITIALIZING";
  let message = "";
  let rowData: any = null;

  try {
    const tmpDir = path.join(process.cwd(), '.next');
    const dbPath = path.join(tmpDir, 'test_sqlite_phase3b.db');

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec('CREATE TABLE IF NOT EXISTS phase3b_test (id INTEGER PRIMARY KEY, title TEXT, created_at INTEGER)');
    
    const stmt = db.prepare('INSERT INTO phase3b_test (title, created_at) VALUES (?, ?)');
    const result = stmt.run('Phase 3B SQLite Verification', Date.now());

    const readStmt = db.prepare('SELECT * FROM phase3b_test WHERE id = ?');
    rowData = readStmt.get(result.lastInsertRowid);

    db.close();

    // Clean up temporary database
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    } catch {}

    status = "SUCCESS";
    message = "better-sqlite3 executed successfully inside Electron/Next.js runtime!";
  } catch (err: any) {
    status = "FAILED";
    message = err?.message || String(err);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "system-ui", background: "#090d16", color: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ color: "#6366f1", fontSize: "28px", marginBottom: "16px" }}>Phase 3B — SQLite Compatibility Test</h1>
      
      <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", maxWidth: "600px" }}>
        <p style={{ fontSize: "18px", marginBottom: "12px" }}>
          Status: <strong style={{ color: status === "SUCCESS" ? "#4ade80" : "#f87171" }}>{status}</strong>
        </p>
        <p style={{ color: "#94a3b8", marginBottom: "16px" }}>{message}</p>
        
        {rowData && (
          <pre style={{ background: "#0f172a", padding: "12px", borderRadius: "6px", color: "#38bdf8", overflowX: "auto" }}>
            {JSON.stringify(rowData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
