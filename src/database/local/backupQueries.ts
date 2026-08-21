import type { Database } from "better-sqlite3";

export interface BackupHistoryRecord {
  id: string;
  created_at: number;
  file_name: string;
  file_path: string;
  file_size: number;
  status: string;
  backup_type: string;
  error_message: string | null;
  checksum: string | null;
}

export function createBackupRecordDb(db: Database, record: BackupHistoryRecord): void {
  const stmt = db.prepare(`
    INSERT INTO backup_history (id, created_at, file_name, file_path, file_size, status, backup_type, error_message, checksum)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    record.id,
    record.created_at,
    record.file_name,
    record.file_path,
    record.file_size,
    record.status,
    record.backup_type,
    record.error_message,
    record.checksum
  );
}

export function updateBackupRecordDb(db: Database, id: string, updates: Partial<BackupHistoryRecord>): void {
  const fields = [];
  const values = [];
  
  if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
  if (updates.error_message !== undefined) { fields.push("error_message = ?"); values.push(updates.error_message); }
  if (updates.file_size !== undefined) { fields.push("file_size = ?"); values.push(updates.file_size); }
  if (updates.checksum !== undefined) { fields.push("checksum = ?"); values.push(updates.checksum); }
  
  if (fields.length === 0) return;
  
  values.push(id);
  const sql = `UPDATE backup_history SET ${fields.join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...values);
}

export function getBackupHistoryDb(db: Database, limit = 50): BackupHistoryRecord[] {
  return db.prepare(`
    SELECT * FROM backup_history
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as BackupHistoryRecord[];
}

export function deleteBackupRecordDb(db: Database, id: string): void {
  db.prepare(`DELETE FROM backup_history WHERE id = ?`).run(id);
}
