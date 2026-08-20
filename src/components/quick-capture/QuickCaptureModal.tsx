"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Zap,
  Check,
  Copy,
  Folder,
  Layers,
  Sparkles,
  Tag,
  AlignLeft,
  AlignRight,
  Globe,
  Loader2,
} from "lucide-react";
import { createPrompt } from "@/services/prompts/promptService";
import { fetchCategories, CategoryItem } from "@/services/categories/categoryService";
import { fetchProjects, ProjectItem } from "@/services/projects/projectService";
import { detectLanguageAndDirection, TextDirection } from "@/components/editor/languageDetector";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (promptId: string) => void;
}

export function QuickCaptureModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickCaptureModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("proj_default");
  const [tagsInput, setTagsInput] = useState("");
  const [direction, setDirection] = useState<TextDirection>("auto");
  const [detectedScript, setDetectedScript] = useState<string>("en");

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load categories and projects
  const loadOptions = useCallback(async () => {
    try {
      const [cats, projs] = await Promise.all([fetchCategories(), fetchProjects()]);
      setCategories(cats);
      setProjects(projs);
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategory(cats[0].name);
        setSelectedCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error("Failed to load options for Quick Capture:", err);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else {
      // Reset form on close
      setTitle("");
      setContent("");
      setDescription("");
      setTagsInput("");
      setDirection("auto");
      setError("");
      setCopied(false);
    }
  }, [isOpen, loadOptions]);

  // Real-time language and direction detection on content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (direction === "auto") {
      const detected = detectLanguageAndDirection(val);
      setDetectedScript(detected.languageCode);
    }
  };

  const handleSave = async (copyToClipboardAfter = false) => {
    const cleanTitle = title.trim() || "Quick Note " + new Date().toLocaleTimeString();
    const cleanContent = content.trim();
    if (!cleanContent) {
      setError("Please enter some prompt content before saving.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await createPrompt({
        title: cleanTitle,
        description: description.trim() || undefined,
        category: selectedCategory,
        categoryId: selectedCategoryId || undefined,
        projectId: selectedProjectId || "proj_default",
        tags: parsedTags,
        content: cleanContent,
        textDirection: direction,
        language: detectedScript,
      });

      if (!res.success) {
        setError(res.error || "Failed to save quick prompt.");
        setSaving(false);
        return;
      }

      if (copyToClipboardAfter) {
        await navigator.clipboard.writeText(cleanContent);
        setCopied(true);
        setTimeout(() => {
          onSuccess?.(res.promptId);
          onClose();
        }, 600);
      } else {
        onSuccess?.(res.promptId);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-foreground animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4 fill-amber-500/20" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Quick Capture Prompt</span>
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                  Ctrl+Shift+N
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Prompt title (e.g. Next.js Auth Helper, Urdu Translation Agent)..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl font-semibold text-foreground placeholder-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Prompt Markdown Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Prompt Markdown Content
              </label>
              {/* Direction controls */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setDirection("auto")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    direction === "auto" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Auto detect language script"
                >
                  <Globe className="h-3 w-3 inline mr-0.5" />
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("ltr")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    direction === "ltr" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Left to right (LTR)"
                >
                  <AlignLeft className="h-3 w-3 inline mr-0.5" />
                  LTR
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("rtl")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    direction === "rtl" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Right to left (RTL)"
                >
                  <AlignRight className="h-3 w-3 inline mr-0.5" />
                  RTL
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={content}
              onChange={handleContentChange}
              dir={direction === "auto" ? (detectedScript === "ur" || detectedScript === "ar" || detectedScript === "he" ? "rtl" : "ltr") : direction}
              placeholder="Paste or write your prompt here (Markdown, Urdu, Arabic, Code blocks, tables, instructions supported)..."
              className="w-full p-3 bg-background border border-border rounded-xl text-foreground font-mono text-xs placeholder-muted-foreground/50 focus:outline-hidden focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          {/* Selectors Row: Category & Workspace */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Folder className="h-3 w-3" />
                <span>Category</span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  const found = categories.find((c) => c.id === e.target.value);
                  if (found) setSelectedCategory(found.name);
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Workspace / Project */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Workspace</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. claude, reasoning, code, marketing"
              className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs placeholder-muted-foreground/50 focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Saves directly as v1 into SQLite & Markdown file</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Save & Copy"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>{saving ? "Saving..." : "Save Prompt"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
