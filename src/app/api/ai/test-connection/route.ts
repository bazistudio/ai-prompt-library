import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { provider, apiKey, ollamaBaseUrl = "http://127.0.0.1:11434" } = body;

    if (provider === "gemini") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) {
        return NextResponse.json({
          success: false,
          message: "Google Gemini API key not provided or set in environment.",
        });
      }

      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: "Respond with only 'OK'.",
        config: { maxOutputTokens: 10 },
      });

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: `Connected successfully to Gemini (${latencyMs}ms)`,
        latencyMs,
        sample: response.text?.trim() || "OK",
      });
    }

    if (provider === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json({
          success: false,
          message: "OpenAI API key not provided or set in environment.",
        });
      }

      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          message: err.error?.message || `Failed to authenticate with OpenAI (${res.status})`,
        });
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: `Connected successfully to OpenAI (${latencyMs}ms)`,
        latencyMs,
      });
    }

    if (provider === "anthropic") {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return NextResponse.json({
          success: false,
          message: "Anthropic API key not provided or set in environment.",
        });
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 10,
          messages: [{ role: "user", content: "Ping" }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          message: err.error?.message || `Failed to authenticate with Anthropic (${res.status})`,
        });
      }

      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: `Connected successfully to Anthropic Claude (${latencyMs}ms)`,
        latencyMs,
      });
    }

    if (provider === "ollama") {
      const cleanBase = (ollamaBaseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
      const res = await fetch(`${cleanBase}/api/tags`, { method: "GET" });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          message: `Ollama is unreachable at ${cleanBase} (${res.status}).`,
        });
      }

      const data = await res.json();
      const modelsCount = Array.isArray(data.models) ? data.models.length : 0;
      const latencyMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        message: `Connected to local Ollama (${modelsCount} model${modelsCount === 1 ? "" : "s"} installed, ${latencyMs}ms)`,
        latencyMs,
        models: data.models?.map((m: any) => m.name) || [],
      });
    }

    return NextResponse.json({ success: false, message: `Unknown provider: ${provider}` });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || "Connection failed.",
    });
  }
}
