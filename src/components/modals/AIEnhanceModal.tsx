"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  Zap,
  Code2,
  Brain,
  FileCheck,
  Copy,
} from "lucide-react";
import { enhancePromptWithAI } from "@/services/ai/aiClientService";

interface AIEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  onApply: (enhancedContent: string) => void;
  onSaveAsVersion?: (enhancedContent: string) => void;
}

type EnhanceMode = "clarity" | "variables" | "system_prompt" | "reasoning" | "grammar";

export function AIEnhanceModal({
  isOpen,
  onClose,
  originalContent,
  onApply,
  onSaveAsVersion,
}: AIEnhanceModalProps) {
  const [mode, setMode] = useState<EnhanceMode>("clarity");
  const [customInstruction, setCustomInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const modes: Array<{
    id: EnhanceMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "clarity",
      label: "Clarity & Structure",
      description: "Eliminate ambiguity and organize sections logically",
      icon: Sparkles,
    },
    {
      id: "variables",
      label: "Add Template Variables",
      description: "Convert placeholders and arguments to {{variables}}",
      icon: Code2,
    },
    {
      id: "system_prompt",
      label: "System Instruction",
      description: "Format into a production-ready role & constraints prompt",
      icon: Zap,
    },
    {
      id: "reasoning",
      label: "Deep Reasoning",
      description: "Add step-by-step thinking instructions and edge-case guards",
      icon: Brain,
    },
    {
      id: "grammar",
      label: "Grammar & Polish",
      description: "Fix spelling, punctuation, and phrasing cleanly",
      icon: FileCheck,
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const res = await enhancePromptWithAI(
      originalContent,
      mode,
      customInstruction.trim() || undefined
    );

    if (res.success && res.enhancedText) {
      setEnhancedText(res.enhancedText);
    } else {
      setError(res.error || "Failed to enhance prompt.");
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    if (!enhancedText) return;
    try {
      await navigator.clipboard.writeText(enhancedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">AI Prompt Enhancer</h2>
            <p className="text-xs text-muted-foreground">
              Optimize, refine, and structure your prompt with Gemini
            </p>
          </div>
        </div>

        {/* Mode Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{m.label}</span>
                </div>
                <p
                  className={`text-[10px] line-clamp-2 ${
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Instruction Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Custom Guidance (Optional)
          </label>
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="e.g., Target senior frontend engineers, limit output to JSON format..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action button */}
        {!enhancedText && (
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{loading ? "Optimizing Prompt..." : "Enhance with Gemini"}</span>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
            {error}
          </div>
        )}

        {/* Enhanced Result Diff / Preview */}
        {enhancedText && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Enhanced Output</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                  Ready to Apply
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="p-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="Re-run with new parameters"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <textarea
              value={enhancedText}
              onChange={(e) => setEnhancedText(e.target.value)}
              rows={8}
              className="w-full p-3 font-mono text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setEnhancedText(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
              >
                Reset & Try Another Mode
              </button>

              <div className="flex items-center gap-2">
                {onSaveAsVersion && (
                  <button
                    onClick={() => {
                      onSaveAsVersion(enhancedText);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold text-xs hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    Save as New Version
                  </button>
                )}

                <button
                  onClick={() => {
                    onApply(enhancedText);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Apply to Active Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
