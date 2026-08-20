"use client";

import { useState, useEffect } from "react";
import {
  AIProvider,
  AVAILABLE_MODELS,
  AIExecutionResponse,
} from "@/services/ai/aiTypes";
import { executeAIPrompt } from "@/services/ai/aiClientService";
import { fetchPrompts, PromptItem } from "@/services/prompts/promptService";
import { MarkdownRenderer } from "@/components/editor/MarkdownRenderer";
import {
  Swords,
  Play,
  Loader2,
  Copy,
  Check,
  Trophy,
  Zap,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";

interface ArenaSlot {
  id: string;
  provider: AIProvider;
  model: string;
  response?: AIExecutionResponse;
  loading?: boolean;
}

export default function ArenaPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [promptContent, setPromptContent] = useState<string>(
    "Write a concise, compelling landing page headline and 3 value propositions for a developer productivity tool."
  );
  const [systemInstruction, setSystemInstruction] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0.7);

  // Arena slots (default to 2 comparison slots)
  const [slots, setSlots] = useState<ArenaSlot[]>([
    {
      id: "slot_1",
      provider: "gemini",
      model: "gemini-3.7-flash",
    },
    {
      id: "slot_2",
      provider: "openai",
      model: "gpt-4o",
    },
  ]);

  const [winnerSlotId, setWinnerSlotId] = useState<string | null>(null);
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  // Load library prompts for quick benchmark selection
  useEffect(() => {
    fetchPrompts().then((items) => setPrompts(items));
  }, []);

  const handleSelectLibraryPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    if (!promptId) return;
    const found = prompts.find((p) => p.id === promptId);
    if (found) {
      const activeVer =
        found.versions?.find((v) => v.version_number === found.current_version) ||
        found.versions?.[0];
      if (activeVer) {
        setPromptContent(activeVer.content);
      }
    }
  };

  const handleAddSlot = () => {
    if (slots.length >= 4) return;
    const newId = `slot_${Date.now()}`;
    const nextProv: AIProvider =
      slots.length === 2 ? "anthropic" : "ollama";
    const available = AVAILABLE_MODELS[nextProv];
    const rec = available.find((m) => m.recommended) || available[0];

    setSlots([
      ...slots,
      {
        id: newId,
        provider: nextProv,
        model: rec ? rec.id : "",
      },
    ]);
  };

  const handleRemoveSlot = (idToRemove: string) => {
    if (slots.length <= 2) return;
    setSlots(slots.filter((s) => s.id !== idToRemove));
    if (winnerSlotId === idToRemove) setWinnerSlotId(null);
  };

  const handleRunArena = async () => {
    if (!promptContent.trim()) return;

    setWinnerSlotId(null);

    // Set all slots to loading
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        loading: true,
        response: undefined,
      }))
    );

    const promises = slots.map(async (slot) => {
      try {
        const res = await executeAIPrompt({
          provider: slot.provider,
          model: slot.model,
          prompt: promptContent,
          systemInstruction: systemInstruction.trim() || undefined,
          temperature,
          promptTitle: `Arena Benchmark (${slot.provider}:${slot.model})`,
        });
        return { slotId: slot.id, response: res };
      } catch (err: any) {
        return {
          slotId: slot.id,
          response: {
            success: false,
            provider: slot.provider,
            model: slot.model,
            latencyMs: 0,
            timestamp: new Date().toISOString(),
            error: err.message || "Failed to execute model in arena.",
          },
        };
      }
    });

    const results = await Promise.allSettled(promises);

    setSlots((prev) =>
      prev.map((s) => {
        const match = results.find(
          (r) => r.status === "fulfilled" && r.value.slotId === s.id
        );
        if (match && match.status === "fulfilled") {
          return {
            ...s,
            loading: false,
            response: match.value.response,
          };
        }
        return { ...s, loading: false };
      })
    );
  };

  const handleCopySlot = async (slotId: string, text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlotId(slotId);
      setTimeout(() => setCopiedSlotId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const fastestLatency = Math.min(
    ...slots
      .filter((s) => s.response?.success && s.response?.latencyMs)
      .map((s) => s.response!.latencyMs!)
  );

  const isAnyLoading = slots.some((s) => s.loading);

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              <span>Model Comparison Arena</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Phase 7
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Benchmark and evaluate multiple LLMs side-by-side with latency, token throughput, and qualitative evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {slots.length < 4 && (
            <button
              onClick={handleAddSlot}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Model Slot ({slots.length}/4)</span>
            </button>
          )}

          <button
            onClick={handleRunArena}
            disabled={isAnyLoading || !promptContent.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md shadow-primary transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-primary-foreground" />
            )}
            <span>{isAnyLoading ? "Benchmarking Models..." : "Run Arena Benchmark"}</span>
          </button>
        </div>
      </div>

      {/* Input / Control Panel */}
      <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Test Prompt Input
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Select an existing prompt from your library or compose a benchmark instruction below.
            </p>
          </div>

          {prompts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Load Prompt:
              </span>
              <select
                value={selectedPromptId}
                onChange={(e) => handleSelectLibraryPrompt(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-background border border-border text-foreground font-medium max-w-xs"
              >
                <option value="">-- Custom Benchmark Prompt --</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <textarea
          value={promptContent}
          onChange={(e) => setPromptContent(e.target.value)}
          rows={4}
          placeholder="Enter prompt instructions to evaluate across models..."
          className="w-full p-3 font-mono text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">
              System Instruction (Optional)
            </label>
            <input
              type="text"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="e.g. Always format in structured markdown bullets."
              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-muted-foreground">
              <span>Temperature</span>
              <span className="font-mono text-foreground">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Arena Columns */}
      <div
        className={`grid gap-4 ${
          slots.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : slots.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {slots.map((slot, index) => {
          const isWinner = winnerSlotId === slot.id;
          const isFastest =
            slot.response?.success &&
            slot.response?.latencyMs === fastestLatency &&
            fastestLatency > 0 &&
            slots.length > 1;

          return (
            <div
              key={slot.id}
              className={`glass-card rounded-2xl border transition-all bg-card flex flex-col justify-between overflow-hidden ${
                isWinner
                  ? "border-amber-500 ring-2 ring-amber-500/40 shadow-lg"
                  : "border-border"
              }`}
            >
              {/* Slot Header */}
              <div className="p-4 border-b border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold flex items-center justify-center">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-xs font-bold text-foreground capitalize">
                      {slot.provider}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {slots.length > 2 && (
                      <button
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="p-1 text-muted-foreground hover:text-danger rounded cursor-pointer"
                        title="Remove model slot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Model Configuration Dropdown */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={slot.provider}
                    onChange={(e) => {
                      const prov = e.target.value as AIProvider;
                      const available = AVAILABLE_MODELS[prov];
                      const rec = available.find((m) => m.recommended) || available[0];
                      setSlots((prev) =>
                        prev.map((s) =>
                          s.id === slot.id
                            ? { ...s, provider: prov, model: rec ? rec.id : "" }
                            : s
                        )
                      );
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-background border border-border text-foreground font-medium"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Claude</option>
                    <option value="ollama">Ollama</option>
                  </select>

                  <select
                    value={slot.model}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setSlots((prev) =>
                        prev.map((s) =>
                          s.id === slot.id ? { ...s, model: newModel } : s
                        )
                      );
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-background border border-border text-foreground font-medium truncate"
                  >
                    {AVAILABLE_MODELS[slot.provider].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metrics Badges */}
                {slot.response?.success && (
                  <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                        isFastest
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {slot.response.latencyMs}ms {isFastest ? "(Fastest)" : ""}
                    </span>

                    {slot.response.tokenCount !== undefined && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <Zap className="h-3 w-3 text-amber-500" />
                        ~{slot.response.tokenCount} tok
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Output Content Area */}
              <div className="p-4 flex-grow min-h-[280px] max-h-[460px] overflow-y-auto">
                {slot.loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-xs font-semibold">Generating inference...</span>
                  </div>
                ) : slot.response?.success ? (
                  <div className="text-xs text-foreground leading-relaxed">
                    <MarkdownRenderer content={slot.response.text || ""} />
                  </div>
                ) : slot.response?.error ? (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger space-y-1">
                    <div className="font-bold">Error</div>
                    <div className="text-[11px] font-mono break-all">
                      {slot.response.error}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground/60 text-xs">
                    Ready for benchmark execution
                  </div>
                )}
              </div>

              {/* Slot Footer Actions */}
              {slot.response?.success && (
                <div className="p-3 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      setWinnerSlotId(winnerSlotId === slot.id ? null : slot.id)
                    }
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      isWinner
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>{isWinner ? "Winner" : "Vote Best"}</span>
                  </button>

                  <button
                    onClick={() => handleCopySlot(slot.id, slot.response?.text)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedSlotId === slot.id ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedSlotId === slot.id ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
