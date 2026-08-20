import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/database/local/manager";
import { verifyLicenseCertificate, DEFAULT_FREE_LICENSE } from "@/services/licensing/licenseVerifier";

export async function GET() {
  try {
    const db = getDatabase();
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'license_data'").get() as { value: string } | undefined;

    if (!row || !row.value) {
      return NextResponse.json({ success: true, license: DEFAULT_FREE_LICENSE });
    }

    const verification = verifyLicenseCertificate(row.value);
    return NextResponse.json({
      success: true,
      license: verification.info,
    });
  } catch (error: any) {
    console.error("[API License GET] Error:", error);
    return NextResponse.json(
      { success: false, license: DEFAULT_FREE_LICENSE, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey } = body;

    if (!licenseKey || typeof licenseKey !== "string" || !licenseKey.trim()) {
      return NextResponse.json(
        { success: false, error: "License key or certificate is required." },
        { status: 400 }
      );
    }

    const verification = verifyLicenseCertificate(licenseKey);
    if (!verification.valid || verification.info.status === "INVALID") {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or unverifiable license certificate." },
        { status: 400 }
      );
    }

    if (verification.info.status === "EXPIRED") {
      return NextResponse.json(
        { success: false, error: "This commercial license key has expired." },
        { status: 400 }
      );
    }

    // Persist verified license into SQLite app_settings
    const db = getDatabase();
    const now = Date.now();
    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('license_data', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(licenseKey.trim(), now);

    return NextResponse.json({
      success: true,
      license: verification.info,
    });
  } catch (error: any) {
    console.error("[API License POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to activate license." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const db = getDatabase();
    db.prepare("DELETE FROM app_settings WHERE key = 'license_data'").run();
    return NextResponse.json({ success: true, license: DEFAULT_FREE_LICENSE });
  } catch (error: any) {
    console.error("[API License DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove license." },
      { status: 500 }
    );
  }
}
