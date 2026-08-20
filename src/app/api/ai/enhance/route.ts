import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, mode = "clarity", customInstruction, apiKey } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt content to enhance is required." },
        { status: 400 }
      );
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Gemini API key is required to use AI prompt enhancement.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

    const systemPrompt =
      "You are an expert prompt engineer. Your job is to refine, structure, and optimize user prompts to achieve maximum precision, clarity, and effectiveness when executed with modern LLMs.";

    let userPrompt = "";

    switch (mode) {
      case "variables":
        userPrompt = `Analyze the following prompt and replace hardcoded sample values, placeholders, or customizable inputs with clean double-bracket variables like {{variable_name}} or {{variable_name:default_value}}. Keep the prompt's core intent identical.\n\nPROMPT:\n${content}\n\nReturn ONLY the enhanced prompt. Do not wrap in markdown quotes or preamble.`;
        break;

      case "system_prompt":
        userPrompt = `Rewrite the following prompt into a professional, production-grade System Instruction (Role, Objectives, Formatting Rules, Guardrails, Output Constraints).\n\nPROMPT:\n${content}\n\nReturn ONLY the revised prompt.`;
        break;

      case "reasoning":
        userPrompt = `Optimize the following prompt for deep reasoning models (e.g. o3-mini, Gemini 3.1 Pro, Claude 3.7 Sonnet). Add step-by-step thinking instructions, edge-case analysis guidelines, and structured verification steps.\n\nPROMPT:\n${content}\n\nReturn ONLY the enhanced prompt.`;
        break;

      case "grammar":
        userPrompt = `Fix all spelling, punctuation, grammar, and phrasing issues in the following prompt without changing its functional requirements or structure.\n\nPROMPT:\n${content}\n\nReturn ONLY the corrected prompt.`;
        break;

      case "clarity":
      default:
        userPrompt = `Refine the following prompt to improve clarity, remove ambiguity, structure the requirements logically with headings or bullets if appropriate, and ensure high-fidelity responses from LLMs.\n\nPROMPT:\n${content}\n\n${
          customInstruction ? `SPECIAL USER INSTRUCTION:\n${customInstruction}\n\n` : ""
        }Return ONLY the enhanced prompt.`;
        break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    const enhancedText = response.text?.trim() || content;

    return NextResponse.json({
      success: true,
      enhancedText,
      mode,
    });
  } catch (error: any) {
    console.error("[AI Enhance] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enhance prompt with AI." },
      { status: 500 }
    );
  }
}
