"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AIProvider,
  AVAILABLE_MODELS,
  AIExecutionResponse,
} from "@/services/ai/aiTypes";
import {
  executeAIPrompt,
  getSavedAISettings,
} from "@/services/ai/aiClientService";
import { MarkdownRenderer } from "@/components/editor/MarkdownRenderer";
import {
  Play,
  Loader2,
  Copy,
  Check,
  SlidersHorizontal,
  Bot,
  Save,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";

interface AIPlaygroundRunnerProps {
  promptId: string;
  promptTitle: string;
  renderedContent: string;
  rawContent: string;
  className?: string;
  onSaveAsVersion?: (outputContent: string) => void;
}

export function AIPlaygroundRunner({
  promptId,
  promptTitle,
  renderedContent,
  rawContent,
  className = "",
  onSaveAsVersion,
}: AIPlaygroundRunnerProps) {
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [model, setModel] = useState("gemini-3.7-flash");
  const [useRendered, setUseRendered] = useState(true);
  const [systemInstruction, setSystemInstruction] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [showConfig, setShowConfig] = useState(false);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIExecutionResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  // Load user default AI settings on mount
  useEffect(() => {
    const saved = getSavedAISettings();
    if (saved.defaultProvider) {
      setProvider(saved.defaultProvider);
    }
    if (saved.defaultModel) {
      setModel(saved.defaultModel);
    }
    if (saved.temperature !== undefined) {
      setTemperature(saved.temperature);
    }
    if (saved.maxTokens !== undefined) {
      setMaxTokens(saved.maxTokens);
    }
  }, []);

  // Update model when provider changes
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const available = AVAILABLE_MODELS[newProvider];
    const rec = available.find((m) => m.recommended) || available[0];
    if (rec) {
      setModel(rec.id);
    }
  };

  const activePromptText = useMemo(() => {
    return useRendered ? renderedContent : rawContent;
  }, [useRendered, renderedContent, rawContent]);

  const handleRun = async () => {
    if (!activePromptText.trim()) return;

    setLoading(true);
    setResponse(null);

    const res = await executeAIPrompt({
      provider,
      model,
      prompt: activePromptText,
      systemInstruction: systemInstruction.trim() || undefined,
      temperature,
      maxTokens,
      promptId,
      promptTitle,
    });

    setResponse(res);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!response?.text) return;
    try {
      await navigator.clipboard.writeText(response.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Log usage
      if (promptId) {
        fetch(`/api/desktop-prompts/${promptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logUsage" }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to copy output:", err);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Control Header */}
      <div className="glass-card p-4 rounded-2xl border border-border bg-card space-y-4 text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>AI Execution Playground</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Multi-LLM
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Run and benchmark this prompt against live AI models
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showConfig
                  ? "bg-secondary text-secondary-foreground border-border"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Parameters</span>
            </button>

            <button
              onClick={handleRun}
              disabled={loading || !activePromptText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md shadow-primary transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-primary-foreground" />
              )}
              <span>{loading ? "Generating Output..." : "Run with AI"}</span>
            </button>
          </div>
        </div>

        {/* Provider & Model Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
          {/* Provider Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
              AI Provider
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
              {(["gemini", "openai", "anthropic", "ollama"] as AIProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                    provider === p
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "ollama" ? "Local Ollama" : p}
                </button>
              ))}
            </div>
          </div>

          {/* Model Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {AVAILABLE_MODELS[provider].map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.contextWindow ? `(${m.contextWindow})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Config Drawer */}
        {showConfig && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-4 animate-in fade-in duration-150">
            {/* System Instruction */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">System Instruction (Optional)</label>
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="e.g. You are a senior technical writer. Keep answers concise."
                rows={2}
                className="w-full p-2.5 text-xs rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Temperature</span>
                  <span className="font-mono text-foreground">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Max Output Tokens</span>
                  <span className="font-mono text-foreground">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Source switch */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">Prompt Source for Execution:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseRendered(true)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] cursor-pointer ${
                    useRendered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Template Variables Applied
                </button>
                <button
                  type="button"
                  onClick={() => setUseRendered(false)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] cursor-pointer ${
                    !useRendered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Raw Prompt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Execution Output Panel */}
      {loading && (
        <div className="glass-card p-12 rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div>
            <div className="text-xs font-bold text-foreground">
              Executing with {model}...
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Streaming inference response via server-side bridge
            </div>
          </div>
        </div>
      )}

      {response && !loading && (
        <div className="glass-card rounded-2xl border border-border bg-card overflow-hidden text-left space-y-0 animate-in fade-in duration-200">
          {/* Output Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  response.success ? "bg-status-online" : "bg-danger"
                }`}
              />
              <span className="text-xs font-bold text-foreground">
                {response.success ? "Execution Output" : "Execution Failed"}
              </span>

              {response.success && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {response.latencyMs}ms
                  </span>
                  {response.tokenCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      ~{response.tokenCount} tokens
                    </span>
                  )}
                </div>
              )}
            </div>

            {response.success && (
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setViewMode("formatted")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                      viewMode === "formatted"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Formatted
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                      viewMode === "raw"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Raw
                  </button>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                {/* Save as version button */}
                {onSaveAsVersion && (
                  <button
                    onClick={() => onSaveAsVersion(response.text || "")}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Save response as a new prompt version"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save as Version</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-4">
            {response.success ? (
              viewMode === "formatted" ? (
                <div className="text-xs text-foreground leading-relaxed">
                  <MarkdownRenderer content={response.text || ""} />
                </div>
              ) : (
                <pre className="p-4 rounded-xl bg-background border border-border font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                  {response.text}
                </pre>
              )
            ) : (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Execution Error
                </div>
                <div className="text-[11px] font-mono break-all">{response.error}</div>
                <div className="text-[11px] text-muted-foreground pt-1">
                  Tip: Verify your API key or connection in Settings &gt; AI & Models.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
