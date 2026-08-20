import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { logAuditEventDb, getRecentAuditLogsDb, AuditEventPayload } from "@/database/local/auditQueries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const action = searchParams.get("action") || undefined;
    const entityId = searchParams.get("entityId") || undefined;

    const db = getSQLiteDB();
    const logs = getRecentAuditLogsDb(db, { limit, action, entityId });
    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("[API/audit-logs] Error reading logs:", err);
    return NextResponse.json(
      { error: "Failed to read audit logs." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AuditEventPayload = await req.json();
    if (!body.action || !body.entity || !body.entityId) {
      return NextResponse.json(
        { error: "action, entity, and entityId are required." },
        { status: 400 }
      );
    }

    const db = getSQLiteDB();
    const res = logAuditEventDb(db, body);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("[API/audit-logs] Error logging event:", err);
    return NextResponse.json(
      { error: "Failed to record audit event." },
      { status: 500 }
    );
  }
}
