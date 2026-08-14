"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Tag, Folder, FileText, Sparkles } from "lucide-react";
import { createPrompt } from "@/services/prompts/promptService";
import { CategoryItem, fetchCategories } from "@/services/categories/categoryService";
import { getStoragePath } from "@/services/storage/storageService";
import { FirstUseStorageModal } from "@/components/storage/FirstUseStorageModal";

export default function CreatePromptPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Coding");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // First Use Storage Modal
  const [isFirstUseModalOpen, setIsFirstUseModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) {
          setCategory(cats[0].name);
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
        tags,
        content,
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
    <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-6 text-left">
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
          Save a new prompt template into your offline local database and prompt library folder.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="glass-card p-6 rounded-2xl border border-border space-y-5 bg-card">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Prompt Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. YouTube Video Script Generator, Python Code Reviewer..."
              className="block w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Category & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Tag className="h-3.5 w-3.5 text-primary" />
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="youtube, marketing, script"
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

          {/* Prompt Content */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Prompt Content <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your prompt template from scratch or paste an external prompt here..."
              className="block w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary cursor-pointer disabled:opacity-50"
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
