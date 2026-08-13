import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        username: session.username,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
