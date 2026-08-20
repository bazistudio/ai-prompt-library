import { Database } from "better-sqlite3";
import { v7 as uuidv7 } from "uuid";

export interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
  prompt_count?: number;
  created_at: number;
  updated_at: number;
}

export function getAllProjectsDb(db: Database): ProjectItem[] {
  const stmt = db.prepare(`
    SELECT p.id, p.name, p.description, p.color, p.icon, p.sort_order, p.is_default, p.created_at, p.updated_at,
           COUNT(pr.id) as prompt_count
    FROM projects p
    LEFT JOIN prompts pr ON pr.project_id = p.id AND pr.is_archived = 0
    GROUP BY p.id
    ORDER BY p.is_default DESC, p.sort_order ASC, p.name ASC
  `);
  const rows = stmt.all() as any[];
  return rows.map((r) => ({
    ...r,
    is_default: r.is_default === 1,
    prompt_count: Number(r.prompt_count) || 0,
  }));
}

export function getProjectByIdDb(db: Database, id: string): ProjectItem | null {
  const stmt = db.prepare(`
    SELECT p.id, p.name, p.description, p.color, p.icon, p.sort_order, p.is_default, p.created_at, p.updated_at,
           COUNT(pr.id) as prompt_count
    FROM projects p
    LEFT JOIN prompts pr ON pr.project_id = p.id AND pr.is_archived = 0
    WHERE p.id = ?
    GROUP BY p.id
  `);
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    ...row,
    is_default: row.is_default === 1,
    prompt_count: Number(row.prompt_count) || 0,
  };
}

export function createProjectDb(
  db: Database,
  data: { name: string; description?: string; color?: string; icon?: string }
): { success: boolean; project?: ProjectItem; error?: string } {
  const cleanName = data.name?.trim();
  if (!cleanName) {
    return { success: false, error: "Project name is required." };
  }

  const existing = db.prepare("SELECT id FROM projects WHERE LOWER(name) = LOWER(?)").get(cleanName);
  if (existing) {
    return { success: false, error: `A workspace named "${cleanName}" already exists.` };
  }

  const id = `proj_${uuidv7()}`;
  const now = Date.now();
  const color = data.color || "#6366f1";
  const icon = data.icon || "folder";
  const description = data.description?.trim() || null;

  const maxOrderRow = db.prepare("SELECT MAX(sort_order) as maxOrder FROM projects").get() as any;
  const sortOrder = (maxOrderRow?.maxOrder || 0) + 1;

  db.prepare(`
    INSERT INTO projects (id, name, description, color, icon, sort_order, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, cleanName, description, color, icon, sortOrder, now, now);

  const created = getProjectByIdDb(db, id);
  return { success: true, project: created || undefined };
}

export function updateProjectDb(
  db: Database,
  id: string,
  data: { name?: string; description?: string; color?: string; icon?: string }
): { success: boolean; project?: ProjectItem; error?: string } {
  const current = getProjectByIdDb(db, id);
  if (!current) {
    return { success: false, error: "Project not found." };
  }

  let newName = current.name;
  if (data.name !== undefined) {
    const clean = data.name.trim();
    if (!clean) return { success: false, error: "Project name cannot be empty." };
    if (clean.toLowerCase() !== current.name.toLowerCase()) {
      const duplicate = db.prepare("SELECT id FROM projects WHERE LOWER(name) = LOWER(?) AND id != ?").get(clean, id);
      if (duplicate) {
        return { success: false, error: `A workspace named "${clean}" already exists.` };
      }
    }
    newName = clean;
  }

  const newDesc = data.description !== undefined ? data.description.trim() || null : current.description;
  const newColor = data.color || current.color;
  const newIcon = data.icon || current.icon;
  const now = Date.now();

  db.prepare(`
    UPDATE projects
    SET name = ?, description = ?, color = ?, icon = ?, updated_at = ?
    WHERE id = ?
  `).run(newName, newDesc, newColor, newIcon, now, id);

  const updated = getProjectByIdDb(db, id);
  return { success: true, project: updated || undefined };
}

export function deleteProjectDb(
  db: Database,
  id: string
): { success: boolean; error?: string } {
  const current = getProjectByIdDb(db, id);
  if (!current) {
    return { success: false, error: "Project not found." };
  }

  if (current.is_default || id === "proj_default") {
    return { success: false, error: "Cannot delete the default workspace." };
  }

  // Re-assign all prompts belonging to this project back to default workspace
  db.prepare("UPDATE prompts SET project_id = 'proj_default' WHERE project_id = ?").run(id);

  // Delete project
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);

  return { success: true };
}
