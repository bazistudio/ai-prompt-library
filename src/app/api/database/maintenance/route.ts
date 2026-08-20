import { NextRequest, NextResponse } from "next/server";
import {
  getDatabaseHealth,
  vacuumAndOptimizeDatabase,
  getRawDatabaseBuffer,
} from "@/database/local/maintenanceQueries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "true";

    if (isDownload) {
      const { buffer, filename } = getRawDatabaseBuffer();
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    const health = getDatabaseHealth();
    return NextResponse.json({ success: true, health });
  } catch (error) {
    console.error("GET /api/database/maintenance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve database maintenance stats",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "vacuum";

    if (action === "vacuum") {
      const result = vacuumAndOptimizeDatabase();
      return NextResponse.json({
        success: true,
        message: "Database optimized and defragmented successfully.",
        result,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown maintenance action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/database/maintenance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute database maintenance",
      },
      { status: 500 }
    );
  }
}
