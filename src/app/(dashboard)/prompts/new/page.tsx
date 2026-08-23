"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Tag, Folder, Sparkles, Layers } from "lucide-react";
import { createPrompt } from "@/services/prompts/promptService";
import { CategoryItem, fetchCategories } from "@/services/categories/categoryService";
import { ProjectItem, fetchProjects } from "@/services/projects/projectService";
import { getStoragePath } from "@/services/storage/storageService";
import { FirstUseStorageModal } from "@/components/storage/FirstUseStorageModal";
import { RichMarkdownEditor } from "@/components/editor/RichMarkdownEditor";
import { TextDirection } from "@/components/editor/languageDetector";

function CreatePromptContent() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Coding");
  const [projectId, setProjectId] = useState("proj_default");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [direction, setDirection] = useState<TextDirection>("auto");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Categories & Projects
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  // First Use Storage Modal
  const [isFirstUseModalOpen, setIsFirstUseModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProjects()])
      .then(([cats, projs]) => {
        setCategories(cats);
        setProjects(projs);
        if (cats.length > 0) {
          setCategory(cats[0].name);
        }
        if (projs.length > 0) {
          setProjectId(projs[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const executeSavePrompt = async () => {
    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await createPrompt({
        title,
        description,
        category,
        projectId,
        tags,
        content,
        textDirection: direction,
      });

      if (res.success && res.promptId) {
        router.push(`/prompts/${res.promptId}`);
      }
    } catch (err: any) {
      console.error("Create prompt error:", err);
      setError(err.message || "Failed to save prompt.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a prompt title.");
      return;
    }
    if (!content.trim()) {
      setError("Please enter prompt instructions or paste your prompt content.");
      return;
    }

    try {
      const storagePath = await getStoragePath();
      if (!storagePath) {
        // First-use requirement: prompt user to choose location before saving
        setIsFirstUseModalOpen(true);
        return;
      }
      await executeSavePrompt();
    } catch (err: any) {
      setError(err.message || "Error checking storage path.");
    }
  };

  const handleFirstUseStorageSuccess = async () => {
    setIsFirstUseModalOpen(false);
    await executeSavePrompt();
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-8 space-y-6 text-left">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/prompts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Library</span>
        </Link>
        <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Version 1 Initializer
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Prompt</h1>
        <p className="text-xs text-muted-foreground">
          Multilingual Markdown prompt editor with RTL/LTR support, code snippets, checklists, tables, and images.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="glass-card p-6 rounded-2xl border border-border space-y-5 bg-card">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Prompt Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. YouTube Video Script Generator, Python Code Reviewer, اردو مواد نگار..."
              className="block w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Category, Workspace & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-primary" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Workspace / Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="block w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="youtube, marketing, urdu, ai"
                className="block w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Short Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this prompt produces..."
              className="block w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Multilingual Rich Markdown Prompt Content */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Prompt Instructions & Content <span className="text-destructive">*</span>
            </label>
            <RichMarkdownEditor
              value={content}
              onChange={setContent}
              direction={direction}
              onDirectionChange={setDirection}
              placeholder="Write or paste prompt instructions in English, Urdu (اردو), Arabic (العربية), Hindi (हिन्दी), Chinese (中文), or mixed languages. Use toolbar for checklists, tables, code blocks, highlights, and images..."
              minHeight="min-h-[420px]"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/prompts"
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Version 1...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Prompt (v1)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* First Use Storage Location Modal */}
      <FirstUseStorageModal
        isOpen={isFirstUseModalOpen}
        onClose={() => setIsFirstUseModalOpen(false)}
        onSelectSuccess={handleFirstUseStorageSuccess}
      />
    </div>
  );
}

export default function CreatePromptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading editor...</div>}>
      <CreatePromptContent />
    </Suspense>
  );
}

