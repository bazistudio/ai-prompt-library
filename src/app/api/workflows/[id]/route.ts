import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import {
  getWorkflowByIdDb,
  updateWorkflowDb,
  deleteWorkflowDb,
} from "@/database/local/workflowQueries";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getSQLiteDB();
    const workflow = getWorkflowByIdDb(db, id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("[API/workflows/:id] GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load workflow." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getSQLiteDB();
    const workflow = updateWorkflowDb(db, id, body);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, workflow });
  } catch (error: any) {
    console.error("[API/workflows/:id] PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update workflow." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getSQLiteDB();
    const success = deleteWorkflowDb(db, id);

    if (!success) {
      return NextResponse.json(
        { error: "Workflow not found or could not be deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API/workflows/:id] DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete workflow." },
      { status: 500 }
    );
  }
}
