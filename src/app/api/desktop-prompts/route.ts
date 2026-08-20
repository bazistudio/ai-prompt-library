import { NextRequest, NextResponse } from "next/server";
import { getPrompts, createPrompt, getPromptStats } from "@/database/local/promptStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isStats = searchParams.get("stats") === "true";
    if (isStats) {
      const stats = getPromptStats();
      return NextResponse.json({ success: true, stats });
    }

    const category = searchParams.get("category") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const search = searchParams.get("search") || undefined;
    const favoriteOnly = searchParams.get("favoriteOnly") === "true";

    const prompts = getPrompts({ category, categoryId, projectId, search, favoriteOnly });
    return NextResponse.json({ success: true, prompts });
  } catch (error: any) {
    console.error("GET /api/desktop-prompts error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createPrompt(body);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/desktop-prompts error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
