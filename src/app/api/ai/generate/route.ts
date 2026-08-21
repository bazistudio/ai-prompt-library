import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AIProvider } from "@/services/ai/aiTypes";
import { getSQLiteDB } from "@/database/local/db";
import { logAuditEventDb } from "@/database/local/auditQueries";
import { incrementPromptUsageDb } from "@/database/local/promptQueries";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      provider = "gemini",
      model = "gemini-3.7-flash",
      prompt,
      systemInstruction,
      temperature = 0.7,
      maxTokens = 2048,
      customApiKey,
      ollamaBaseUrl = "http://127.0.0.1:11434",
      promptId,
      promptTitle,
    } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt content is required." },
        { status: 400 }
      );
    }

    let generatedText = "";
    let estimatedTokens = Math.ceil(prompt.length / 4);

    // 1. Google Gemini Provider
    if (provider === "gemini") {
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Google Gemini API key is missing. Please configure GEMINI_API_KEY in environment or AI Settings.",
          },
          { status: 400 }
        );
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel = model || "gemini-3.7-flash";

      const config: Record<string, any> = {
        temperature: Number(temperature) || 0.7,
      };

      if (maxTokens) {
        config.maxOutputTokens = Number(maxTokens);
      }

      if (systemInstruction && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config,
      });

      generatedText = response.text || "";
      if (response.usageMetadata?.totalTokenCount) {
        estimatedTokens = response.usageMetadata.totalTokenCount;
      } else {
        estimatedTokens += Math.ceil(generatedText.length / 4);
      }
    }
    // 2. OpenAI Provider
    else if (provider === "openai") {
      const apiKey = customApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "OpenAI API key is missing. Please configure OPENAI_API_KEY in environment or AI Settings.",
          },
          { status: 400 }
        );
      }

      const messages: Array<{ role: "system" | "user"; content: string }> = [];
      if (systemInstruction && systemInstruction.trim()) {
        messages.push({ role: "system", content: systemInstruction.trim() });
      }
      messages.push({ role: "user", content: prompt });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages,
          temperature: Number(temperature) || 0.7,
          max_tokens: Number(maxTokens) || 2048,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: data.error?.message || `OpenAI error (${res.status})` },
          { status: res.status }
        );
      }

      generatedText = data.choices?.[0]?.message?.content || "";
      if (data.usage?.total_tokens) {
        estimatedTokens = data.usage.total_tokens;
      }
    }
    // 3. Anthropic Claude Provider
    else if (provider === "anthropic") {
      const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Anthropic API key is missing. Please configure ANTHROPIC_API_KEY in environment or AI Settings.",
          },
          { status: 400 }
        );
      }

      const payload: Record<string, any> = {
        model: model || "claude-3-7-sonnet-latest",
        max_tokens: Number(maxTokens) || 2048,
        temperature: Number(temperature) || 0.7,
        messages: [{ role: "user", content: prompt }],
      };

      if (systemInstruction && systemInstruction.trim()) {
        payload.system = systemInstruction.trim();
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: data.error?.message || `Anthropic error (${res.status})` },
          { status: res.status }
        );
      }

      if (Array.isArray(data.content)) {
        generatedText = data.content.map((c: any) => c.text || "").join("");
      }
      if (data.usage) {
        estimatedTokens = (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0);
      }
    }
    // 4. Local Ollama Provider
    else if (provider === "ollama") {
      const cleanBase = (ollamaBaseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
      const endpoint = `${cleanBase}/api/generate`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama3.2",
          prompt,
          system: systemInstruction || undefined,
          stream: false,
          options: {
            temperature: Number(temperature) || 0.7,
            num_predict: Number(maxTokens) || 2048,
          },
        }),
      });

      if (!res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Ollama service unreachable at ${cleanBase} (${res.status}). Make sure 'ollama serve' is running.`,
          },
          { status: res.status }
        );
      }

      const data = await res.json();
      generatedText = data.response || "";
      estimatedTokens += Math.ceil(generatedText.length / 4);
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported AI provider: ${provider}` },
        { status: 400 }
      );
    }

    const latencyMs = Date.now() - startTime;

    // Record audit log asynchronously
    try {
      const db = getSQLiteDB();
      logAuditEventDb(db, {
        action: "prompt.run_template",
        entity: "prompt",
        entityId: promptId || "adhoc_ai_run",
        metadata: {
          provider,
          model,
          latencyMs,
          tokenCount: estimatedTokens,
          promptTitle: promptTitle || "Direct AI Playground Run",
        },
      });

      if (promptId) {
        incrementPromptUsageDb(db, promptId);
      }
    } catch (auditErr) {
      console.warn("[AI Generate] Audit/Usage log error (non-fatal):", auditErr);
    }

    return NextResponse.json({
      success: true,
      text: generatedText,
      provider: provider as AIProvider,
      model,
      latencyMs,
      tokenCount: estimatedTokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[AI Generate] Execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute prompt with AI provider.",
      },
      { status: 500 }
    );
  }
}
