"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  fetchWorkflowById,
  updateWorkflow,
  WorkflowItem,
} from "@/services/workflows/workflowService";
import {
  AIProvider,
  AVAILABLE_MODELS,
} from "@/services/ai/aiTypes";
import { executeAIPrompt } from "@/services/ai/aiClientService";
import { MarkdownRenderer } from "@/components/editor/MarkdownRenderer";
import {
  Workflow,
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Copy,
  Check,
  Loader2,
  Zap,
  AlertCircle,
  Code2,
} from "lucide-react";

interface StepExecutionState {
  status: "idle" | "running" | "completed" | "error";
  output?: string;
  latencyMs?: number;
  tokens?: number;
  error?: string;
}

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [workflow, setWorkflow] = useState<WorkflowItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable steps state
  const [steps, setSteps] = useState<
    Array<{
      id: string;
      step_name: string;
      provider: AIProvider;
      model: string;
      prompt_content: string;
      system_instruction?: string;
      temperature: number;
      max_tokens: number;
    }>
  >([]);

  // Execution state
  const [globalInputs, setGlobalInputs] = useState<Record<string, string>>({});
  const [isRunningChain, setIsRunningChain] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [stepExecutions, setStepExecutions] = useState<Record<number, StepExecutionState>>({});
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [selectedOutputStep, setSelectedOutputStep] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const item = await fetchWorkflowById(id);
      if (item) {
        setWorkflow(item);
        setSteps(
          item.steps.map((s) => ({
            id: s.id,
            step_name: s.step_name,
            provider: s.provider,
            model: s.model,
            prompt_content: s.prompt_content,
            system_instruction: s.system_instruction,
            temperature: s.temperature,
            max_tokens: s.max_tokens,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract global variable placeholders across all steps (e.g. {{topic}}, {{keyword}}, but excluding {{step_N.output}})
  const detectedGlobalVariables = useMemo(() => {
    const vars = new Set<string>();
    const varRegex = /\{\{([^}]+)\}\}/g;

    steps.forEach((step) => {
      let match;
      while ((match = varRegex.exec(step.prompt_content)) !== null) {
        const rawKey = match[1].trim();
        if (!rawKey.startsWith("step_") && !rawKey.includes(".output")) {
          const cleanKey = rawKey.split(":")[0].trim();
          vars.add(cleanKey);
        }
      }
    });

    return Array.from(vars);
  }, [steps]);

  // Initialize global input defaults if detected
  useEffect(() => {
    setGlobalInputs((prev) => {
      const next = { ...prev };
      detectedGlobalVariables.forEach((v) => {
        if (next[v] === undefined) {
          next[v] = "";
        }
      });
      return next;
    });
  }, [detectedGlobalVariables]);

  const handleSavePipeline = async () => {
    if (!workflow) return;
    setSaving(true);
    try {
      await updateWorkflow(workflow.id, {
        steps: steps.map((s) => ({
          step_name: s.step_name,
          provider: s.provider,
          model: s.model,
          prompt_content: s.prompt_content,
          system_instruction: s.system_instruction,
          temperature: s.temperature,
          max_tokens: s.max_tokens,
        })),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadData();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    const nextOrder = steps.length + 1;
    const prevRef = nextOrder > 1 ? `\n\nContext from previous step:\n{{step_${nextOrder - 1}.output}}` : "";
    setSteps([
      ...steps,
      {
        id: `temp_${Date.now()}`,
        step_name: `Step ${nextOrder}: New Phase`,
        provider: "gemini",
        model: "gemini-3.7-flash",
        prompt_content: `Execute subsequent analysis...${prevRef}`,
        system_instruction: "",
        temperature: 0.7,
        max_tokens: 2048,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === steps.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...steps];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setSteps(next);
  };

  const handleRunFullChain = async () => {
    if (steps.length === 0 || isRunningChain) return;

    setIsRunningChain(true);
    const initialExecutions: Record<number, StepExecutionState> = {};
    steps.forEach((_, idx) => {
      initialExecutions[idx] = { status: "idle" };
    });
    setStepExecutions(initialExecutions);

    const stepOutputs: Record<string, string> = {};

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setActiveStepIndex(i);
      setStepExecutions((prev) => ({
        ...prev,
        [i]: { status: "running" },
      }));

      // Interpolate global variables and previous step outputs
      let interpolatedPrompt = step.prompt_content;

      // Replace global variables
      Object.entries(globalInputs).forEach(([key, val]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}(?::[^}]*)?\\s*\\}\\}`, "g");
        interpolatedPrompt = interpolatedPrompt.replace(regex, val || `[${key}]`);
      });

      // Replace step outputs (e.g. {{step_1.output}})
      Object.entries(stepOutputs).forEach(([stepKey, outText]) => {
        const regex = new RegExp(`\\{\\{\\s*${stepKey}\\.output\\s*\\}\\}`, "g");
        interpolatedPrompt = interpolatedPrompt.replace(regex, outText);
      });

      try {
        const result = await executeAIPrompt({
          provider: step.provider,
          model: step.model,
          prompt: interpolatedPrompt,
          systemInstruction: step.system_instruction || undefined,
          temperature: step.temperature,
          maxTokens: step.max_tokens,
          promptId: workflow?.id,
          promptTitle: `${workflow?.name} [Step ${i + 1}]`,
        });

        if (result.success && result.text) {
          stepOutputs[`step_${i + 1}`] = result.text;
          setStepExecutions((prev) => ({
            ...prev,
            [i]: {
              status: "completed",
              output: result.text,
              latencyMs: result.latencyMs,
              tokens: result.tokenCount,
            },
          }));
        } else {
          setStepExecutions((prev) => ({
            ...prev,
            [i]: {
              status: "error",
              error: result.error || "Step execution failed.",
            },
          }));
          break; // Stop sequential chain on error
        }
      } catch (err: any) {
        setStepExecutions((prev) => ({
          ...prev,
          [i]: {
            status: "error",
            error: err.message || "Failed to call AI provider.",
          },
        }));
        break;
      }
    }

    setIsRunningChain(false);
    setActiveStepIndex(null);
  };

  const lastCompletedIndex = useMemo(() => {
    let last = -1;
    steps.forEach((_, idx) => {
      if (stepExecutions[idx]?.status === "completed") {
        last = idx;
      }
    });
    return last;
  }, [steps, stepExecutions]);

  const activeDisplayOutput = useMemo(() => {
    const targetIdx = selectedOutputStep !== null ? selectedOutputStep : lastCompletedIndex;
    if (targetIdx >= 0 && stepExecutions[targetIdx]?.output) {
      return {
        stepName: steps[targetIdx]?.step_name,
        output: stepExecutions[targetIdx].output!,
        latencyMs: stepExecutions[targetIdx].latencyMs,
        tokens: stepExecutions[targetIdx].tokens,
        stepIndex: targetIdx,
      };
    }
    return null;
  }, [selectedOutputStep, lastCompletedIndex, stepExecutions, steps]);

  const handleCopyFinal = async () => {
    if (!activeDisplayOutput?.output) return;
    try {
      await navigator.clipboard.writeText(activeDisplayOutput.output);
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Opening workflow studio...</span>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Workflow Not Found</h2>
        <Link
          href="/workflows"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workflows</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-8 space-y-6 text-left">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{workflow.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                {workflow.category}
              </span>
            </div>
            {workflow.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{workflow.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-success font-semibold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Pipeline Saved
            </span>
          )}

          <button
            onClick={handleSavePipeline}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? "Saving..." : "Save Pipeline"}</span>
          </button>

          <button
            onClick={handleRunFullChain}
            disabled={isRunningChain || steps.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-md shadow-primary transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunningChain ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-primary-foreground" />
            )}
            <span>{isRunningChain ? "Executing Chain..." : "Run Full Chain"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Multi-Step Pipeline Architecture (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" />
              <span>Pipeline Steps ({steps.length})</span>
            </h2>

            <button
              onClick={handleAddStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const execState = stepExecutions[idx];
              const isCurrentActive = activeStepIndex === idx;

              return (
                <div
                  key={step.id || idx}
                  className={`glass-card rounded-2xl border transition-all bg-card p-5 space-y-4 ${
                    isCurrentActive
                      ? "border-primary ring-1 ring-primary shadow-md"
                      : execState?.status === "completed"
                      ? "border-success/40"
                      : "border-border"
                  }`}
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.step_name}
                        onChange={(e) => {
                          const next = [...steps];
                          next[idx].step_name = e.target.value;
                          setSteps(next);
                        }}
                        className="font-bold text-xs bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveStep(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(idx, "down")}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1 rounded text-muted-foreground hover:text-danger disabled:opacity-30 cursor-pointer"
                        title="Remove Step"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Provider & Model Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Provider
                      </label>
                      <select
                        value={step.provider}
                        onChange={(e) => {
                          const prov = e.target.value as AIProvider;
                          const next = [...steps];
                          next[idx].provider = prov;
                          const rec =
                            AVAILABLE_MODELS[prov].find((m) => m.recommended) ||
                            AVAILABLE_MODELS[prov][0];
                          if (rec) next[idx].model = rec.id;
                          setSteps(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground font-medium"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="ollama">Local Ollama</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Model
                      </label>
                      <select
                        value={step.model}
                        onChange={(e) => {
                          const next = [...steps];
                          next[idx].model = e.target.value;
                          setSteps(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground font-medium"
                      >
                        {AVAILABLE_MODELS[step.provider].map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Prompt Template Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                      <span>Prompt Template</span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...steps];
                            next[idx].prompt_content += `\n\n{{step_${idx}.output}}`;
                            setSteps(next);
                          }}
                          className="text-primary hover:underline lowercase font-mono cursor-pointer"
                        >
                          + inject {`{{step_${idx}.output}}`}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={step.prompt_content}
                      onChange={(e) => {
                        const next = [...steps];
                        next[idx].prompt_content = e.target.value;
                        setSteps(next);
                      }}
                      rows={4}
                      className="w-full p-3 font-mono text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Controller & Pipeline Outputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 sticky top-20">
          {/* Global Variables Input Card */}
          {detectedGlobalVariables.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-primary" />
                <span>Global Chain Inputs</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Values specified here are injected into every step referencing them.
              </p>

              <div className="space-y-2.5 pt-1">
                {detectedGlobalVariables.map((v) => (
                  <div key={v} className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-foreground">
                      {`{{${v}}}`}
                    </label>
                    <input
                      type="text"
                      value={globalInputs[v] || ""}
                      onChange={(e) =>
                        setGlobalInputs({ ...globalInputs, [v]: e.target.value })
                      }
                      placeholder={`Enter test value for ${v}...`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sequential Execution Pipeline Tracker */}
          <div className="glass-card p-5 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span>Execution Flow</span>
              </span>
              {isRunningChain && (
                <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> In Progress
                </span>
              )}
            </h3>

            <div className="space-y-2">
              {steps.map((s, idx) => {
                const exec = stepExecutions[idx];
                const isSelected = selectedOutputStep === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (exec?.status === "completed") {
                        setSelectedOutputStep(idx);
                      }
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : exec?.status === "completed"
                        ? "bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                        : exec?.status === "running"
                        ? "bg-primary/5 border-primary/40 animate-pulse text-foreground"
                        : "bg-muted/10 border-border/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                          exec?.status === "completed"
                            ? "bg-success/20 text-success"
                            : exec?.status === "running"
                            ? "bg-primary text-primary-foreground"
                            : exec?.status === "error"
                            ? "bg-danger/20 text-danger"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold truncate">{s.step_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                      {exec?.status === "running" && (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                      )}
                      {exec?.status === "completed" && (
                        <span className="text-success flex items-center gap-1 font-semibold">
                          <Check className="h-3.5 w-3.5" />
                          {exec.latencyMs}ms
                        </span>
                      )}
                      {exec?.status === "error" && (
                        <span className="text-danger flex items-center gap-1 font-semibold">
                          <AlertCircle className="h-3.5 w-3.5" /> Error
                        </span>
                      )}
                      {(!exec || exec.status === "idle") && (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Output Card */}
          {activeDisplayOutput && (
            <div className="glass-card rounded-2xl border border-border bg-card overflow-hidden space-y-0 animate-in fade-in duration-200">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {activeDisplayOutput.stepName} Output
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
                    <span>{activeDisplayOutput.latencyMs}ms</span>
                    <span>~{activeDisplayOutput.tokens} tokens</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyFinal}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedFinal ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedFinal ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 max-h-[380px] overflow-y-auto text-xs text-foreground leading-relaxed">
                <MarkdownRenderer content={activeDisplayOutput.output} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
