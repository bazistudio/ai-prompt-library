"use client";

import { useState, useMemo, useEffect } from "react";
import {
  extractTemplateVariables,
  renderTemplate,
} from "@/services/templates/templateEngine";
import {
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertCircle,
  Eye,
} from "lucide-react";

interface TemplateVariableRunnerProps {
  promptId: string;
  promptTitle: string;
  content: string;
  className?: string;
  onRunLogged?: () => void;
}

export function TemplateVariableRunner({
  promptId,
  promptTitle,
  content,
  className = "",
  onRunLogged,
}: TemplateVariableRunnerProps) {
  const variables = useMemo(() => extractTemplateVariables(content), [content]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  // Initialize values with default values when variables change
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const v of variables) {
      if (v.defaultValue !== undefined) {
        initial[v.name] = v.defaultValue;
      }
    }
    setValues(initial);
  }, [variables]);

  const handleInputChange = (varName: string, val: string) => {
    setValues((prev) => ({ ...prev, [varName]: val }));
  };

  const handleReset = () => {
    const defaults: Record<string, string> = {};
    for (const v of variables) {
      if (v.defaultValue !== undefined) {
        defaults[v.name] = v.defaultValue;
      }
    }
    setValues(defaults);
  };

  const renderResult = useMemo(() => {
    return renderTemplate(content, values);
  }, [content, values]);

  const handleCopyRendered = async () => {
    if (!renderResult.renderedText) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(renderResult.renderedText);
      } else {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = renderResult.renderedText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (promptId) {
        fetch(`/api/desktop-prompts/${promptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logUsage" }),
        }).catch(() => {});
      }

      // Record audit event asynchronously (non-blocking)
      fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prompt.run_template",
          entity: "prompt",
          entityId: promptId,
          metadata: {
            title: promptTitle,
            variableCount: variables.length,
            unfilledCount: renderResult.unfilledVariables.length,
          },
        }),
      }).catch((e) => console.warn("[Audit] Could not log template run:", e));

      if (onRunLogged) {
        onRunLogged();
      }
    } catch (err) {
      console.error("Failed to copy rendered prompt:", err);
    }
  };

  if (variables.length === 0) {
    return null; // No variables detected in this prompt content
  }

  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-card/60 dark:bg-card/40 backdrop-blur-md overflow-hidden shadow-sm transition-all ${className}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Template Variable Runner
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono font-medium">
                {variables.length} {variables.length === 1 ? "variable" : "variables"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Fill in the parameters below to generate an LLM-ready prompt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Reset variables to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showPreview
                ? "bg-muted text-foreground border-border"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
          </button>
        </div>
      </div>

      {/* Variable Inputs Grid */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {variables.map((v) => {
            const curVal = values[v.name] ?? "";
            return (
              <div
                key={v.rawKey}
                className="p-3 rounded-xl border border-border/80 bg-background/50 hover:border-primary/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`var-input-${v.rawKey}`}
                    className="font-mono font-medium text-foreground flex items-center gap-1"
                  >
                    <span>&#123;&#123;{v.name}&#125;&#125;</span>
                    {v.required && !v.defaultValue && (
                      <span className="text-rose-500 font-sans text-xs">*</span>
                    )}
                  </label>
                  {v.defaultValue && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Default: {v.defaultValue}
                    </span>
                  )}
                </div>
                <input
                  id={`var-input-${v.rawKey}`}
                  type="text"
                  value={curVal}
                  onChange={(e) => handleInputChange(v.name, e.target.value)}
                  placeholder={v.defaultValue ? `e.g. ${v.defaultValue}` : `Enter ${v.name}...`}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-sans"
                />
              </div>
            );
          })}
        </div>

        {/* Live Preview & Action */}
        {showPreview && (
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Compiled Output Preview
              </span>
              {renderResult.unfilledVariables.length > 0 && (
                <span className="text-[11px] text-amber-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {renderResult.unfilledVariables.length} unfilled variable(s)
                </span>
              )}
            </div>

            <div className="relative rounded-xl border border-border bg-muted/30 p-3.5 max-h-48 overflow-y-auto text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap select-text">
              {renderResult.renderedText}
            </div>
          </div>
        )}

        {/* Copy CTA */}
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleCopyRendered}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all active:scale-98"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Rendered Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
