"use client";

import { useState, useEffect } from "react";
import { SettingsSection } from "./SettingsSection";
import {
  AIProvider,
  AVAILABLE_MODELS,
  AISettingsConfig,
  DEFAULT_AI_SETTINGS,
} from "@/services/ai/aiTypes";
import {
  getSavedAISettings,
  saveAISettings,
  testAIConnection,
} from "@/services/ai/aiClientService";
import {
  Bot,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Cpu,
  Zap,
} from "lucide-react";

export function AISettings() {
  const [settings, setSettings] = useState<AISettingsConfig>(DEFAULT_AI_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Connection testing states
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: AIProvider;
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setSettings(getSavedAISettings());
  }, []);

  const handleSave = () => {
    saveAISettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTest = async (provider: AIProvider) => {
    setTestingProvider(provider);
    setTestResult(null);

    const apiKey =
      provider === "gemini"
        ? settings.geminiApiKey
        : provider === "openai"
        ? settings.openaiApiKey
        : provider === "anthropic"
        ? settings.anthropicApiKey
        : undefined;

    const res = await testAIConnection(provider, apiKey, settings.ollamaBaseUrl);
    setTestResult({
      provider,
      success: res.success,
      message: res.message,
    });
    setTestingProvider(null);
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Default Provider & Model */}
      <SettingsSection
        title="Default AI Provider & Model"
        description="Choose your primary LLM for executing prompts and generating test outputs."
      >
        <div className="glass-card p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Provider */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Primary Provider</label>
              <select
                value={settings.defaultProvider}
                onChange={(e) => {
                  const prov = e.target.value as AIProvider;
                  const rec =
                    AVAILABLE_MODELS[prov].find((m) => m.recommended) ||
                    AVAILABLE_MODELS[prov][0];
                  setSettings({
                    ...settings,
                    defaultProvider: prov,
                    defaultModel: rec ? rec.id : "",
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="ollama">Local Ollama</option>
              </select>
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Default Model</label>
              <select
                value={settings.defaultModel}
                onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {AVAILABLE_MODELS[settings.defaultProvider].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.contextWindow ? `(${m.contextWindow})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Temperature & Max Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Default Temperature</span>
                <span className="font-mono text-foreground">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={settings.temperature}
                onChange={(e) =>
                  setSettings({ ...settings, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Default Max Output Tokens</span>
                <span className="font-mono text-foreground">{settings.maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={settings.maxTokens}
                onChange={(e) =>
                  setSettings({ ...settings, maxTokens: parseInt(e.target.value) })
                }
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 2. Provider API Keys & Endpoints */}
      <SettingsSection
        title="API Credentials & Local Endpoints"
        description="Keys are stored securely in local app storage and passed directly to the server execution bridge."
      >
        <div className="space-y-4">
          {/* Google Gemini Card */}
          <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Google Gemini API</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Powers prompt enhancement, runner, and multimodal generation
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTest("gemini")}
                disabled={testingProvider === "gemini"}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingProvider === "gemini" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 text-primary" />
                )}
                <span>Test Connection</span>
              </button>
            </div>

            <input
              type="password"
              value={settings.geminiApiKey || ""}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="AIzaSy... (leave blank to use GEMINI_API_KEY environment variable)"
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {testResult?.provider === "gemini" && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* OpenAI Card */}
          <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">OpenAI API</h4>
                  <p className="text-[10px] text-muted-foreground">GPT-4o, GPT-4o-mini, o3-mini models</p>
                </div>
              </div>

              <button
                onClick={() => handleTest("openai")}
                disabled={testingProvider === "openai"}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingProvider === "openai" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 text-emerald-500" />
                )}
                <span>Test Connection</span>
              </button>
            </div>

            <input
              type="password"
              value={settings.openaiApiKey || ""}
              onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
              placeholder="sk-... (leave blank to use OPENAI_API_KEY environment variable)"
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {testResult?.provider === "openai" && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Anthropic Claude Card */}
          <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Anthropic Claude API</h4>
                  <p className="text-[10px] text-muted-foreground">Claude 3.7 Sonnet, Claude 3.5 Haiku</p>
                </div>
              </div>

              <button
                onClick={() => handleTest("anthropic")}
                disabled={testingProvider === "anthropic"}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingProvider === "anthropic" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 text-amber-500" />
                )}
                <span>Test Connection</span>
              </button>
            </div>

            <input
              type="password"
              value={settings.anthropicApiKey || ""}
              onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
              placeholder="sk-ant-... (leave blank to use ANTHROPIC_API_KEY environment variable)"
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {testResult?.provider === "anthropic" && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Local Ollama Card */}
          <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Local Ollama Endpoint</h4>
                  <p className="text-[10px] text-muted-foreground">
                    100% offline local LLMs (Llama 3.2, DeepSeek R1, Mistral)
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTest("ollama")}
                disabled={testingProvider === "ollama"}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingProvider === "ollama" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 text-sky-500" />
                )}
                <span>Test Local Endpoint</span>
              </button>
            </div>

            <input
              type="text"
              value={settings.ollamaBaseUrl || ""}
              onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
              placeholder="http://127.0.0.1:11434"
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {testResult?.provider === "ollama" && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {savedSuccess ? (
          <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            AI Preferences Saved Successfully!
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Changes take effect immediately across all prompt runners.</div>
        )}

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md shadow-primary transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save AI Settings</span>
        </button>
      </div>
    </div>
  );
}
