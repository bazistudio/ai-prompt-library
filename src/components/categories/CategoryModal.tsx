"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Edit2, X, Loader2 } from "lucide-react";
import { CategoryItem, createCategory, renameCategory } from "@/services/categories/categoryService";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
}

export function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(categoryToEdit);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
    } else {
      setName("");
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && categoryToEdit) {
        const res = await renameCategory(categoryToEdit.id, name.trim());
        if (res.success && res.category) {
          onSuccess(res.category);
          onClose();
        } else {
          setError(res.error || "Failed to rename category.");
        }
      } else {
        const res = await createCategory(name.trim());
        if (res.success && res.category) {
          onSuccess(res.category);
          onClose();
        } else {
          setError(res.error || "Failed to create category.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              {isEdit ? <Edit2 className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isEdit ? "Rename Category" : "Create New Category"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEdit
                  ? "Update display name and folder name."
                  : "Add a new category folder to your Prompt Library."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Category Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Tools, Social Media, Product Prompts..."
              className="block w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Physical folder will be created automatically in your prompt storage location.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? "Save Name" : "Create Category"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
