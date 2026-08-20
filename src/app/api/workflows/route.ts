import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { getAllWorkflowsDb, createWorkflowDb } from "@/database/local/workflowQueries";

export async function GET() {
  try {
    const db = getSQLiteDB();
    const workflows = getAllWorkflowsDb(db);
    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error("[API/workflows] GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load workflows." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Workflow name is required." },
        { status: 400 }
      );
    }

    const db = getSQLiteDB();
    const workflow = createWorkflowDb(db, body);
    return NextResponse.json({ success: true, workflow });
  } catch (error: any) {
    console.error("[API/workflows] POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create workflow." },
      { status: 500 }
    );
  }
}
