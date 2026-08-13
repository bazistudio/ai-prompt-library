import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToMongoDB } from "@/lib/mongodb/db";
import { getSQLiteDB } from "@/lib/sqlite/db";
import { User } from "@/models/User";
import { registerSchema } from "@/lib/validation/auth";
import { setSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB();
    
    // SQLite initialization check for Electron local preparation
    try {
      getSQLiteDB();
    } catch (sqliteErr) {
      console.error("SQLite initialization during register failed:", sqliteErr);
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, email, password } = result.data;

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return NextResponse.json(
        { success: false, message: "A user with this username already exists" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      username,
      passwordHash,
      status: "active",
    });
    await newUser.save();

    const payload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      username: newUser.username,
    };
    await setSession(payload);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          username: newUser.username,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
