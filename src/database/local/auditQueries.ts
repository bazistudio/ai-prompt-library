import type { Database } from "better-sqlite3";
import { v7 as uuidv7 } from "uuid";

export interface AuditEventPayload {
  action: "prompt.create" | "prompt.update" | "prompt.version_add" | "prompt.copy" | "prompt.run_template" | "prompt.favorite" | "prompt.delete" | "project.create" | "category.create" | "batch.export" | "batch.import";
  entity: "prompt" | "version" | "project" | "category" | "library";
  entityId: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogItem {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export function logAuditEventDb(
  db: Database,
  payload: AuditEventPayload
): { success: boolean; id?: string } {
  try {
    const id = uuidv7();
    const now = Date.now();
    const userId = payload.userId || "local_user";
    const tenantId = payload.tenantId || "local_workspace";
    const metadataStr = payload.metadata ? JSON.stringify(payload.metadata) : null;

    const stmt = db.prepare(`
      INSERT INTO audit_log (id, tenant_id, user_id, action, entity, entity_id, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, tenantId, userId, payload.action, payload.entity, payload.entityId, now, metadataStr);
    return { success: true, id };
  } catch (err) {
    console.error("[AuditLog] Failed to record event:", err);
    return { success: false };
  }
}

export function getRecentAuditLogsDb(
  db: Database,
  options: { limit?: number; action?: string; entityId?: string } = {}
): AuditLogItem[] {
  const limit = options.limit || 20;
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.action) {
    conditions.push("action = ?");
    params.push(options.action);
  }
  if (options.entityId) {
    conditions.push("entity_id = ?");
    params.push(options.entityId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT id, tenant_id, user_id, action, entity, entity_id, timestamp, metadata
    FROM audit_log
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  params.push(limit);

  try {
    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      tenant_id: string;
      user_id: string;
      action: string;
      entity: string;
      entity_id: string;
      timestamp: number;
      metadata: string | null;
    }>;

    return rows.map((r) => {
      let parsedMeta: Record<string, any> | undefined = undefined;
      if (r.metadata) {
        try {
          parsedMeta = JSON.parse(r.metadata);
        } catch {
          parsedMeta = undefined;
        }
      }
      return {
        id: r.id,
        tenant_id: r.tenant_id,
        user_id: r.user_id,
        action: r.action,
        entity: r.entity,
        entity_id: r.entity_id,
        timestamp: r.timestamp,
        metadata: parsedMeta,
      };
    });
  } catch (err) {
    console.error("[AuditLog] Failed to fetch audit logs:", err);
    return [];
  }
}
