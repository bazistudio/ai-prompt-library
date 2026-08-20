export type AIProvider = "gemini" | "openai" | "anthropic" | "ollama";

export interface AIModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow?: string;
  description?: string;
  recommended?: boolean;
}

export const AVAILABLE_MODELS: Record<AIProvider, AIModelOption[]> = {
  gemini: [
    {
      id: "gemini-3.7-flash",
      name: "Gemini 3.7 Flash",
      provider: "gemini",
      contextWindow: "1M tokens",
      description: "Fastest response with advanced multimodal reasoning (Default)",
      recommended: true,
    },
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      provider: "gemini",
      contextWindow: "2M tokens",
      description: "Deep reasoning, coding, and complex STEM tasks",
    },
    {
      id: "gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash Lite",
      provider: "gemini",
      contextWindow: "1M tokens",
      description: "Ultra-low latency for high-frequency text tasks",
    },
  ],
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      contextWindow: "128k tokens",
      description: "High-intelligence flagship model",
      recommended: true,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "openai",
      contextWindow: "128k tokens",
      description: "Affordable and fast for lightweight tasks",
    },
    {
      id: "o3-mini",
      name: "o3-mini",
      provider: "openai",
      contextWindow: "200k tokens",
      description: "Advanced reasoning model for STEM and code",
    },
  ],
  anthropic: [
    {
      id: "claude-3-7-sonnet-latest",
      name: "Claude 3.7 Sonnet",
      provider: "anthropic",
      contextWindow: "200k tokens",
      description: "Hybrid reasoning and instant high-quality text output",
      recommended: true,
    },
    {
      id: "claude-3-5-haiku-latest",
      name: "Claude 3.5 Haiku",
      provider: "anthropic",
      contextWindow: "200k tokens",
      description: "Fast and lightweight Claude model",
    },
  ],
  ollama: [
    {
      id: "llama3.2",
      name: "Llama 3.2",
      provider: "ollama",
      description: "Meta's efficient lightweight open model",
      recommended: true,
    },
    {
      id: "mistral",
      name: "Mistral 7B",
      provider: "ollama",
      description: "Fast versatile local instruction model",
    },
    {
      id: "deepseek-r1",
      name: "DeepSeek R1",
      provider: "ollama",
      description: "Open reasoning model for local analysis",
    },
    {
      id: "qwen2.5",
      name: "Qwen 2.5",
      provider: "ollama",
      description: "Multilingual coding and math specialist",
    },
  ],
};

export interface AIExecutionRequest {
  provider: AIProvider;
  model: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  customApiKey?: string;
  ollamaBaseUrl?: string;
  promptId?: string;
  promptTitle?: string;
}

export interface AIExecutionResponse {
  success: boolean;
  text?: string;
  error?: string;
  provider: AIProvider;
  model: string;
  latencyMs: number;
  tokenCount?: number;
  timestamp: string;
}

export interface AISettingsConfig {
  defaultProvider: AIProvider;
  defaultModel: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl?: string;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_AI_SETTINGS: AISettingsConfig = {
  defaultProvider: "gemini",
  defaultModel: "gemini-3.7-flash",
  geminiApiKey: "",
  openaiApiKey: "",
  anthropicApiKey: "",
  ollamaBaseUrl: "http://127.0.0.1:11434",
  temperature: 0.7,
  maxTokens: 2048,
};
