"use client";

import { useState, useEffect, use } from "react";
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
  Save,
  Loader2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  fetchPromptById,
  addPromptVersion,
  toggleFavorite,
  deletePrompt,
  PromptItem,
  PromptVersion,
} from "@/services/prompts/promptService";

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [prompt, setPrompt] = useState<PromptItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPromptData = async () => {
    try {
      const data = await fetchPromptById(id);
      setPrompt(data);
      if (data && data.versions && data.versions.length > 0) {
        const latest = data.current_version || data.versions[data.versions.length - 1].version_number;
        setSelectedVersionNum(latest);
        const activeVerObj = data.versions.find((v) => v.version_number === latest);
        setEditedContent(activeVerObj ? activeVerObj.content : "");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load prompt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromptData();
  }, [id]);

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
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!prompt) return;
    try {
      const res = await toggleFavorite(prompt.id);
      setPrompt((prev) => (prev ? { ...prev, is_favorite: res.is_favorite } : null));
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
                prompt.is_favorite ? "text-accent fill-accent" : "text-muted-foreground"
              }`}
            />
            <span>{prompt.is_favorite ? "Starred" : "Star Favorite"}</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg border border-danger/30 bg-danger/10 text-xs font-semibold text-danger flex items-center gap-1.5 hover:bg-danger/20 transition-colors cursor-pointer"
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
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Latest: v{prompt.current_version}
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
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary shrink-0 cursor-pointer"
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
              className="px-3 py-1 rounded-lg bg-accent/20 text-accent border border-accent/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-accent/30 transition-colors cursor-pointer"
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
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
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

      {/* Prompt Text Workspace & Editor */}
      <div className="glass-card p-6 rounded-2xl border border-border space-y-4 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Prompt Instructions (v{selectedVersionNum})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Edit Content
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              rows={14}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="block w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Optional version note (e.g. Added video title hook)..."
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
              />

              <button
                onClick={handleSaveAsNewVersion}
                disabled={savingVersion || !editedContent.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-md shadow-primary cursor-pointer disabled:opacity-50"
              >
                {savingVersion ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving v{(prompt.current_version || 1) + 1}...</span>
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
        ) : (
          <div className="relative group">
            <pre className="w-full p-4 rounded-xl bg-background border border-border font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap overflow-x-auto min-h-[240px]">
              {activeVersion?.content || editedContent}
            </pre>

            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-card/90 border border-border text-xs font-semibold text-foreground opacity-80 group-hover:opacity-100 hover:bg-card transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
