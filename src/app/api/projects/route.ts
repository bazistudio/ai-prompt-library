import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import {
  getAllProjectsDb,
  getProjectByIdDb,
  createProjectDb,
  updateProjectDb,
  deleteProjectDb,
} from "@/database/local/projectQueries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const db = getSQLiteDB();

    if (id) {
      const project = getProjectByIdDb(db, id);
      if (!project) {
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, project });
    }

    const projects = getAllProjectsDb(db);
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getSQLiteDB();
    const res = createProjectDb(db, body);
    if (!res.success) {
      return NextResponse.json({ success: false, message: res.error }, { status: 400 });
    }
    return NextResponse.json(res, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const db = getSQLiteDB();
    const res = updateProjectDb(db, id, body);
    if (!res.success) {
      return NextResponse.json({ success: false, message: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("PUT /api/projects error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 });
    }

    const db = getSQLiteDB();
    const res = deleteProjectDb(db, id);
    if (!res.success) {
      return NextResponse.json({ success: false, message: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("DELETE /api/projects error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
