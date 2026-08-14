import { NextRequest, NextResponse } from "next/server";
import {
  getPromptById,
  addPromptVersion,
  updatePromptMeta,
  toggleFavorite,
  deletePrompt,
} from "@/database/local/promptStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prompt = getPromptById(id);
    if (!prompt) {
      return NextResponse.json({ success: false, message: "Prompt not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, prompt });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.action === "addVersion") {
      const result = await addPromptVersion({ promptId: id, content: body.content, changeSummary: body.changeSummary });
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    } else if (body.action === "toggleFavorite") {
      const result = toggleFavorite(id);
      return NextResponse.json(result);
    } else if (body.action === "updateMeta") {
      const result = updatePromptMeta({ promptId: id, title: body.title, description: body.description, category: body.category, tags: body.tags });
      return NextResponse.json(result);
    }
    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = deletePrompt(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
