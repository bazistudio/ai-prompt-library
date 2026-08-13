import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectToMongoDB } from "@/lib/mongodb/db";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToMongoDB();
    const userDoc = await User.findById(session.userId).select("username email status createdAt");
    
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc._id.toString(),
        email: userDoc.email,
        username: userDoc.username,
        status: userDoc.status || "active",
        createdAt: userDoc.createdAt,
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
