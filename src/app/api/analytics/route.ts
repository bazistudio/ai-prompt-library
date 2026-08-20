import { NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { getAnalyticsSummaryDb } from "@/database/local/analyticsQueries";

export async function GET() {
  try {
    const db = getSQLiteDB();
    const summary = getAnalyticsSummaryDb(db);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("[API/analytics] Error computing metrics:", err);
    return NextResponse.json(
      { error: "Failed to generate analytics summary." },
      { status: 500 }
    );
  }
}
