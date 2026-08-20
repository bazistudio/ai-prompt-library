"use client";

import { useState, useMemo } from "react";
import {
  Wand2,
  X,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  AlignLeft,
  BookOpen,
  Copy,
  Plus,
} from "lucide-react";
import { detectLanguageAndDirection, TextDirection } from "@/components/editor/languageDetector";
import { createPrompt } from "@/services/prompts/promptService";

interface PasteOrganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (promptId: string) => void;
}

type ContentType = "project" | "learning" | "documentation" | "research" | "general" | "prompt_collection";

interface StructureNode {
  title: string;
  type: "heading" | "phase" | "section" | "task" | "resource";
  level: number;
  children?: StructureNode[];
}

export function PasteOrganizeModal({ isOpen, onClose, onSuccess }: PasteOrganizeModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [preserveMarkdown, setPreserveMarkdown] = useState(true);
  const [contentType, setContentType] = useState<ContentType>("project");

  // Step 3 Organization options
  const [createSections, setCreateSections] = useState(true);
  const [extractHeadings, setExtractHeadings] = useState(true);
  const [createPhases, setCreatePhases] = useState(true);
  const [extractTasks, setExtractTasks] = useState(true);
  const [preserveChecklists, setPreserveChecklists] = useState(true);

  // Step 4 Editable Organized Text
  const [organizedContent, setOrganizedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Real-time Text Statistics & RTL Detection
  const stats = useMemo(() => {
    const chars = rawText.length;
    const words = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
    const lines = rawText ? rawText.split("\n").length : 0;
    const lang = detectLanguageAndDirection(rawText);
    return { chars, words, lines, lang };
  }, [rawText]);

  // Deterministic Frontend Structure Parser
  const detectedStructure = useMemo(() => {
    if (!rawText.trim()) return [];

    const nodes: StructureNode[] = [];
    const lines = rawText.split("\n");

    let currentPhase: StructureNode | null = null;
    let currentSection: StructureNode | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect Phase (e.g. "Phase 1: Setup", "Step 1 - ...")
      if (createPhases && /^(phase|step|stage|sprint|part)\s+\d+[:\-\s]/i.test(trimmed)) {
        currentPhase = {
          title: trimmed.replace(/^[#*\s-]+/, ""),
          type: "phase",
          level: 1,
          children: [],
        };
        nodes.push(currentPhase);
        currentSection = null;
        continue;
      }

      // Detect Headings (# Heading, ## Subheading)
      if (extractHeadings && trimmed.startsWith("#")) {
        const level = (trimmed.match(/^#+/) || ["#"])[0].length;
        const cleanTitle = trimmed.replace(/^#+\s*/, "");
        const headingNode: StructureNode = {
          title: cleanTitle,
          type: "heading",
          level,
          children: [],
        };

        if (currentPhase && level > 1) {
          currentPhase.children?.push(headingNode);
        } else {
          nodes.push(headingNode);
          currentSection = headingNode;
        }
        continue;
      }

      // Detect Tasks (- [ ] task, * [ ] task, 1. task)
      if (extractTasks && (/^[-*]\s*\[[ xX]\]/.test(trimmed) || /^\d+\.\s+\[[ xX]\]/.test(trimmed))) {
        const taskText = trimmed.replace(/^[-*\d.]+\s*\[[ xX]\]\s*/, "");
        const taskNode: StructureNode = {
          title: taskText,
          type: "task",
          level: 2,
        };

        if (currentSection) {
          currentSection.children?.push(taskNode);
        } else if (currentPhase) {
          currentPhase.children?.push(taskNode);
        } else {
          nodes.push(taskNode);
        }
        continue;
      }
    }

    if (nodes.length === 0) {
      nodes.push({
        title: "Main Content Overview",
        type: "section",
        level: 1,
        children: [
          { title: "Introduction & Context", type: "heading", level: 2 },
          { title: "Core Instructions & Logic", type: "heading", level: 2 },
        ],
      });
    }

    return nodes;
  }, [rawText, createPhases, extractHeadings, extractTasks]);

  // Generate clean organized markdown for Step 4
  const buildOrganizedDocument = () => {
    let docTitle = title.trim();
    if (!docTitle) {
      // Auto-extract first heading or line
      const firstHeading = rawText.match(/^#+\s+(.+)$/m);
      docTitle = firstHeading ? firstHeading[1] : `Organized ${contentType.toUpperCase()} Document`;
    }

    let output = `# ${docTitle}\n\n`;
    output += `> **Type:** ${contentType.replace("_", " ").toUpperCase()} • **Parsed:** ${new Date().toLocaleDateString()}\n\n`;

    if (createSections) {
      output += `## Overview\n\n`;
    }

    const body = rawText;
    if (preserveChecklists) {
      // Keep checkboxes intact
    }

    output += body;
    return output;
  };

  const handleProceedToPreview = () => {
    const formatted = buildOrganizedDocument();
    setOrganizedContent(formatted);
    setStep(4);
  };

  const handleSavePrompt = async () => {
    if (!organizedContent.trim()) return;
    setSaving(true);

    try {
      const promptTitle = title.trim() || `Organized ${contentType} - ${new Date().toLocaleDateString()}`;
      const res = await createPrompt({
        title: promptTitle,
        description: `Imported via Paste & Organize wizard (${contentType})`,
        content: organizedContent,
        category: contentType.charAt(0).toUpperCase() + contentType.slice(1),
        tags: ["organized", contentType, "ai-response"],
        textDirection: stats.lang.direction as TextDirection,
      });

      if (res && res.promptId) {
        onSuccess?.(res.promptId);
        onClose();
      }
    } catch (err) {
      console.error("Failed to save organized prompt:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(organizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Paste & Organize</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Step {step} of 4
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Structure large AI responses into clean, editable prompt documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 border-b border-border text-center text-xs font-semibold">
          {[
            { num: 1, label: "1. Paste" },
            { num: 2, label: "2. Content Type" },
            { num: 3, label: "3. Organize" },
            { num: 4, label: "4. Preview & Create" },
          ].map((s) => (
            <div
              key={s.num}
              className={`py-2.5 transition-colors border-b-2 ${
                step === s.num
                  ? "border-primary text-primary bg-primary/5 font-bold"
                  : step > s.num
                  ? "border-emerald-500 text-emerald-500 bg-emerald-500/5"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: PASTE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Document Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js Architecture Blueprint"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground">Paste AI Output / Raw Content</label>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{stats.words} words</span>
                    <span>•</span>
                    <span>{stats.chars} chars</span>
                    <span>•</span>
                    <span className="font-mono uppercase text-primary font-semibold">{stats.lang.scriptName}</span>
                  </div>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  dir={stats.lang.direction === "rtl" ? "rtl" : "ltr"}
                  placeholder="Paste your unformatted AI output, conversation transcript, research notes, or prompt draft here..."
                  className="w-full h-64 p-4 rounded-xl border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveMarkdown}
                    onChange={(e) => setPreserveMarkdown(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Preserve raw Markdown formatting and code blocks</span>
                </label>

                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText("")}
                    className="text-xs text-destructive hover:underline cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: CONTENT TYPE */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-left">
                <h3 className="text-sm font-bold text-foreground">What kind of content is this?</h3>
                <p className="text-xs text-muted-foreground">
                  Selecting the content type applies optimized structuring rules and tags.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: "project",
                    title: "Project / Roadmap",
                    desc: "Tasks, milestones, phases, and architectural specifications",
                    icon: Layers,
                  },
                  {
                    id: "learning",
                    title: "Learning Notes / Q&A",
                    desc: "Study concepts, summaries, flashcards, and tutorials",
                    icon: BookOpen,
                  },
                  {
                    id: "documentation",
                    title: "Technical Documentation",
                    desc: "API guides, code documentation, and references",
                    icon: FileText,
                  },
                  {
                    id: "research",
                    title: "Research Findings",
                    desc: "Hypotheses, evidence, citations, and summaries",
                    icon: Sparkles,
                  },
                  {
                    id: "prompt_collection",
                    title: "Prompt Collection",
                    desc: "Series of reusable system prompts and templates",
                    icon: Wand2,
                  },
                  {
                    id: "general",
                    title: "General Notes",
                    desc: "Unstructured thoughts, meetings, or transcripts",
                    icon: AlignLeft,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = contentType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setContentType(item.id as ContentType)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-xs"
                          : "bg-background border-border hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: HOW SHOULD IT BE ORGANIZED */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-left">
                <h3 className="text-sm font-bold text-foreground">How should it be organized?</h3>
                <p className="text-xs text-muted-foreground">
                  Select structural transformations to automatically apply to the document.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {[
                  {
                    checked: createSections,
                    setter: setCreateSections,
                    title: "Create Overview & Summary Sections",
                    desc: "Inject structured document preamble and contextual headers",
                  },
                  {
                    checked: extractHeadings,
                    setter: setExtractHeadings,
                    title: "Extract Headings & Hierarchy",
                    desc: "Normalize H1, H2, H3 tags according to section depth",
                  },
                  {
                    checked: createPhases,
                    setter: setCreatePhases,
                    title: "Group Sequential Phases / Steps",
                    desc: "Recognize Phase 1, Step 1, Part 1 markers and group child items",
                  },
                  {
                    checked: extractTasks,
                    setter: setExtractTasks,
                    title: "Extract Tasks & Action Items",
                    desc: "Convert bullet items into interactive task checklists",
                  },
                  {
                    checked: preserveChecklists,
                    setter: setPreserveChecklists,
                    title: "Preserve Markdown Checklists (- [ ])",
                    desc: "Maintain existing checklist completion states",
                  },
                ].map((rule, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={rule.checked}
                      onChange={(e) => rule.setter(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground">{rule.title}</div>
                      <div className="text-[11px] text-muted-foreground">{rule.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW STRUCTURE & EDIT */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Detected Structure Tree */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>Detected Structure</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground overflow-y-auto max-h-72 pr-1">
                    <div className="font-bold text-foreground">Overview</div>
                    {detectedStructure.map((node, i) => (
                      <div key={i} className="pl-3 border-l border-border/60">
                        <span className="text-foreground">
                          {node.type === "phase" ? "📦 " : node.type === "task" ? "☑ " : "├── "}
                          {node.title}
                        </span>
                        {node.children && node.children.length > 0 && (
                          <div className="pl-3 border-l border-border/40 mt-1 space-y-1">
                            {node.children.map((child, j) => (
                              <div key={j} className="text-[10px] text-muted-foreground">
                                └── {child.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editable Final Markdown Document */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Edit Before Creating</label>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copied" : "Copy Markdown"}</span>
                    </button>
                  </div>
                  <textarea
                    value={organizedContent}
                    onChange={(e) => setOrganizedContent(e.target.value)}
                    dir={stats.lang.direction === "rtl" ? "rtl" : "ltr"}
                    className="w-full h-72 p-3.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {step < 3 && (
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={() => setStep((prev) => (prev + 1) as any)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Preview Structure</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={saving || !organizedContent.trim()}
                onClick={handleSavePrompt}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create Prompt Document</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
