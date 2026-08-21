import { NextResponse } from "next/server";
import { landingConfig } from "@/config/landingConfig";

export async function GET() {
  try {
    // Controlled public API exposing ONLY safe metadata
    const responsePayload = {
      success: true,
      latestVersion: landingConfig.version,
      releaseDate: landingConfig.publicStats?.releaseDate || "2026-08-20",
      productStatus: landingConfig.publicStats?.productStatus || "available",
      platform: landingConfig.publicStats?.platform || "Windows Desktop",
      // downloads omitted until backed by verified real data source
    };

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch public statistics" },
      { status: 500 }
    );
  }
}
