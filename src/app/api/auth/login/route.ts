import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToMongoDB } from "@/database/online/db";
import { User } from "@/database/online/models/User";
import { loginSchema } from "@/lib/validation/auth";
import { setSession } from "@/auth/online/session";

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB();

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 400 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 400 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Account is not active" },
        { status: 403 }
      );
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    };
    await setSession(payload);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
