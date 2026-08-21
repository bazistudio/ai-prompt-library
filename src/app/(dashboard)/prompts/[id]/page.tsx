"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Star,
  History,
  PlusCircle,
  Folder,
  Tag,
  Clock,
  Trash2,
  Loader2,
  Sparkles,
  RotateCcw,
  Edit3,
  Eye,
  FileCode,
  Activity,
} from "lucide-react";
import {
  fetchPromptById,
  addPromptVersion,
  toggleFavorite,
  deletePrompt,
  PromptItem,
  PromptVersion,
} from "@/services/prompts/promptService";
import { MarkdownRenderer } from "@/components/editor/MarkdownRenderer";
import { RichMarkdownEditor } from "@/components/editor/RichMarkdownEditor";
import { TextDirection } from "@/components/editor/languageDetector";
import { TemplateVariableRunner } from "@/components/prompts/TemplateVariableRunner";
import { AIPlaygroundRunner } from "@/components/prompts/AIPlaygroundRunner";
import { AIEnhanceModal } from "@/components/modals/AIEnhanceModal";

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [prompt, setPrompt] = useState<PromptItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [direction, setDirection] = useState<TextDirection>("auto");
  const [changeSummary, setChangeSummary] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewFormat, setViewFormat] = useState<"formatted" | "raw">("formatted");
  const [error, setError] = useState<string | null>(null);

  // Phase 6 AI state
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<"runner" | "ai">("ai");

  const loadPromptData = useCallback(async () => {
    try {
      const data = await fetchPromptById(id);
      setPrompt(data);
      if (data) {
        setDirection(data.text_direction || "auto");
        if (data.versions && data.versions.length > 0) {
          const latest = data.current_version || data.versions[data.versions.length - 1].version_number;
          setSelectedVersionNum(latest);
          const activeVerObj = data.versions.find((v) => v.version_number === latest);
          setEditedContent(activeVerObj ? activeVerObj.content : "");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load prompt.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPromptData();
  }, [loadPromptData]);

  const activeVersion: PromptVersion | undefined = prompt?.versions?.find(
    (v) => v.version_number === selectedVersionNum
  );

  const isCurrentVersion = selectedVersionNum === prompt?.current_version;

  const handleSelectVersion = (verNum: number) => {
    setSelectedVersionNum(verNum);
    const ver = prompt?.versions?.find((v) => v.version_number === verNum);
    if (ver) {
      setEditedContent(ver.content);
    }
    setIsEditing(false);
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedContent : activeVersion?.content || editedContent;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Async audit and usage log
      if (prompt) {
        fetch(`/api/desktop-prompts/${prompt.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logUsage" }),
        }).catch(() => {});

        fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "prompt.copy",
            entity: "prompt",
            entityId: prompt.id,
            metadata: {
              title: prompt.title,
              version: selectedVersionNum,
            },
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!prompt) return;
    try {
      const res = await toggleFavorite(prompt.id);
      setPrompt((prev) => (prev ? { ...prev, is_favorite: res.is_favorite } : null));

      fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prompt.favorite",
          entity: "prompt",
          entityId: prompt.id,
          metadata: {
            title: prompt.title,
            is_favorite: res.is_favorite,
          },
        }),
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!prompt) return;
    if (confirm(`Are you sure you want to delete "${prompt.title}"?`)) {
      try {
        await deletePrompt(prompt.id);
        router.push("/prompts");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!prompt || !editedContent.trim()) return;
    setSavingVersion(true);
    setError(null);

    try {
      const res = await addPromptVersion({
        promptId: prompt.id,
        content: editedContent.trim(),
        changeSummary: changeSummary.trim() || undefined,
      });

      if (res.success) {
        setChangeSummary("");
        setIsEditing(false);
        await loadPromptData();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save new version.");
    } finally {
      setSavingVersion(false);
    }
  };

  const handleRestoreAsNewVersion = async () => {
    if (!prompt || !activeVersion) return;
    if (
      confirm(
        `Restore Version v${activeVersion.version_number} content as a new Version v${
          (prompt.current_version || 1) + 1
        }?`
      )
    ) {
      setSavingVersion(true);
      try {
        const res = await addPromptVersion({
          promptId: prompt.id,
          content: activeVersion.content,
          changeSummary: `Restored from version v${activeVersion.version_number}`,
        });

        if (res.success) {
          setIsEditing(false);
          await loadPromptData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSavingVersion(false);
      }
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Opening prompt document...</span>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Prompt Not Found</h2>
        <p className="text-xs text-muted-foreground">{error || "Prompt does not exist in local database."}</p>
        <Link
          href="/prompts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Library</span>
        </Link>
      </div>
    );
  }

  const currentContentToDisplay = activeVersion?.content || editedContent;

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-8 space-y-6 text-left">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/prompts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <Star
              className={`h-3.5 w-3.5 ${
                prompt.is_favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
              }`}
            />
            <span>{prompt.is_favorite ? "Starred" : "Star Favorite"}</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive flex items-center gap-1.5 hover:bg-destructive/20 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Metadata Header */}
      <div className="glass-card p-6 rounded-2xl border border-border space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-secondary text-foreground border border-border flex items-center gap-1">
                <Folder className="h-3 w-3 text-primary" />
                {prompt.category}
              </span>
              {prompt.project_name && (
                <span
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-border"
                  style={{
                    backgroundColor: `${prompt.project_color || "#6366f1"}15`,
                    color: prompt.project_color || "#6366f1",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: prompt.project_color || "#6366f1" }}
                  />
                  {prompt.project_name}
                </span>
              )}
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Active: v{selectedVersionNum} (of v{prompt.current_version})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase">
                {direction.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{prompt.description}</p>
            )}
          </div>

          {/* Primary Copy Prompt Action Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-primary-foreground" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Active Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Tags & Dates */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 flex-wrap">
            {prompt.tags && prompt.tags.length > 0 ? (
              prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))
            ) : (
              <span className="italic opacity-60">No tags assigned</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              0 uses
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated: {formatDate(prompt.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Version History Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-border space-y-4 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Immutable Version History
            </h3>
          </div>

          {!isCurrentVersion && (
            <button
              onClick={handleRestoreAsNewVersion}
              disabled={savingVersion}
              className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore v{selectedVersionNum} as New Version</span>
            </button>
          )}
        </div>

        {/* Version Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {prompt.versions?.map((ver) => {
            const isSelected = ver.version_number === selectedVersionNum;
            const isLatest = ver.version_number === prompt.current_version;

            return (
              <button
                key={ver.id}
                onClick={() => handleSelectVersion(ver.version_number)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                }`}
              >
                <span>v{ver.version_number}</span>
                {isLatest && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-background/20 text-primary-foreground" : "bg-primary/20 text-primary"
                    }`}
                  >
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Version Meta Note */}
        {activeVersion && (
          <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
            <span>
              <strong>Note:</strong> {activeVersion.change_summary || `Version v${activeVersion.version_number}`}
            </span>
            <span>Recorded: {formatDate(activeVersion.created_at)}</span>
          </div>
        )}
      </div>

      {/* Workbench Tab Selector & Interactive Runners */}
      {!isEditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <button
              onClick={() => setActiveWorkbenchTab("ai")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkbenchTab === "ai"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Live Playground</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-background/20">
                Phase 6
              </span>
            </button>

            <button
              onClick={() => setActiveWorkbenchTab("runner")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkbenchTab === "runner"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Template Variable Runner</span>
            </button>
          </div>

          {activeWorkbenchTab === "ai" ? (
            <AIPlaygroundRunner
              promptId={prompt.id}
              promptTitle={prompt.title}
              rawContent={activeVersion?.content || editedContent}
              renderedContent={activeVersion?.content || editedContent}
              onSaveAsVersion={async (output) => {
                setEditedContent(output);
                setChangeSummary("AI Generated Output / Variation");
                setIsEditing(true);
              }}
            />
          ) : (
            <TemplateVariableRunner
              promptId={prompt.id}
              promptTitle={prompt.title}
              content={activeVersion?.content || editedContent}
            />
          )}
        </div>
      )}

      {/* Prompt Instructions Content & Editor */}
      <div className="glass-card p-6 rounded-2xl border border-border space-y-4 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Prompt Instructions (v{selectedVersionNum})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Enhance Button */}
            <button
              onClick={() => setEnhanceModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Enhance, optimize, or structure with Gemini"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enhance with AI</span>
            </button>

            {!isEditing && (
              <div className="flex items-center bg-muted/60 border border-border rounded-lg p-0.5 text-xs mr-1">
                <button
                  type="button"
                  onClick={() => setViewFormat("formatted")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewFormat === "formatted" ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Rich View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewFormat("raw")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewFormat === "raw" ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileCode className="h-3 w-3" />
                  <span>Raw Text</span>
                </button>
              </div>
            )}

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit & New Version</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (activeVersion) setEditedContent(activeVersion.content);
                }}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <RichMarkdownEditor
              value={editedContent}
              onChange={setEditedContent}
              direction={direction}
              onDirectionChange={setDirection}
              placeholder="Edit prompt instructions with rich markdown formatting..."
              minHeight="min-h-[400px]"
            />

            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Version change summary (e.g. Added Arabic translation & table rules)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring/50"
                />

                <button
                  onClick={handleSaveAsNewVersion}
                  disabled={savingVersion || !editedContent.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingVersion ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Recording v{(prompt.current_version || 1) + 1}...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>Save as Version v{(prompt.current_version || 1) + 1}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group">
            {viewFormat === "formatted" ? (
              <div className="p-6 rounded-2xl bg-card border border-border min-h-[260px] shadow-2xs">
                <MarkdownRenderer
                  content={currentContentToDisplay}
                  textDirection={direction}
                  interactiveChecklists={false}
                />
              </div>
            ) : (
              <pre
                className="w-full p-5 rounded-2xl bg-background border border-border font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap overflow-x-auto min-h-[260px]"
                dir={direction === "auto" ? "auto" : direction}
              >
                {currentContentToDisplay}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* AI Enhancement Modal */}
      <AIEnhanceModal
        isOpen={enhanceModalOpen}
        onClose={() => setEnhanceModalOpen(false)}
        originalContent={isEditing ? editedContent : activeVersion?.content || editedContent}
        onApply={(enhanced) => {
          setEditedContent(enhanced);
          setIsEditing(true);
        }}
        onSaveAsVersion={async (enhanced) => {
          setEditedContent(enhanced);
          setChangeSummary("Enhanced with Gemini AI");
          setIsEditing(true);
        }}
      />
    </div>
  );
}

