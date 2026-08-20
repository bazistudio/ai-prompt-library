import {
  AIProvider,
  AIExecutionRequest,
  AIExecutionResponse,
  AISettingsConfig,
  DEFAULT_AI_SETTINGS,
} from "./aiTypes";

const AI_STORAGE_KEY = "ai_prompt_library_ai_settings_v1";

/**
 * Retrieves stored AI configuration from localStorage with defaults.
 */
export function getSavedAISettings(): AISettingsConfig {
  if (typeof window === "undefined") {
    return DEFAULT_AI_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

/**
 * Persists AI configuration to localStorage.
 */
export function saveAISettings(settings: Partial<AISettingsConfig>): AISettingsConfig {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;
  const current = getSavedAISettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save AI settings to local storage:", err);
  }
  return updated;
}

/**
 * Executes an AI prompt against the server-side proxy route.
 */
export async function executeAIPrompt(
  request: AIExecutionRequest
): Promise<AIExecutionResponse> {
  const saved = getSavedAISettings();

  // Attach stored key or url if not explicitly provided in request
  const effectiveRequest: AIExecutionRequest = {
    ...request,
    customApiKey:
      request.customApiKey ||
      (request.provider === "gemini"
        ? saved.geminiApiKey
        : request.provider === "openai"
        ? saved.openaiApiKey
        : request.provider === "anthropic"
        ? saved.anthropicApiKey
        : undefined),
    ollamaBaseUrl: request.ollamaBaseUrl || saved.ollamaBaseUrl,
  };

  const startTime = Date.now();

  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(effectiveRequest),
    });

    const data = await res.json();
    const latencyMs = Date.now() - startTime;

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `AI execution failed with status ${res.status}`,
        provider: request.provider,
        model: request.model,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      text: data.text,
      provider: request.provider,
      model: request.model,
      latencyMs: data.latencyMs || latencyMs,
      tokenCount: data.tokenCount,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error while connecting to AI server",
      provider: request.provider,
      model: request.model,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Tests connection to a given AI provider.
 */
export async function testAIConnection(
  provider: AIProvider,
  apiKey?: string,
  ollamaBaseUrl?: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  try {
    const res = await fetch("/api/ai/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, ollamaBaseUrl }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || "Connection test failed." };
  }
}

/**
 * Calls the AI optimization assistant to enhance/refine prompt text.
 */
export async function enhancePromptWithAI(
  content: string,
  mode: "clarity" | "variables" | "system_prompt" | "reasoning" | "grammar",
  customInstruction?: string
): Promise<{ success: boolean; enhancedText?: string; error?: string }> {
  try {
    const saved = getSavedAISettings();
    const res = await fetch("/api/ai/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        mode,
        customInstruction,
        apiKey: saved.geminiApiKey,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || "Prompt enhancement request failed." };
  }
}
