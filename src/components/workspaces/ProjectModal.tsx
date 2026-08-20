"use client";

import { useState, useEffect } from "react";
import { X, Folder, Layers, Sparkles, Code2, Briefcase, Bookmark, Cpu, Hash, Palette, Check } from "lucide-react";
import { ProjectItem, createProject, updateProject } from "@/services/projects/projectService";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: ProjectItem) => void;
  projectToEdit?: ProjectItem | null;
}

const COLOR_OPTIONS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Purple", value: "#a855f7" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Orange", value: "#f97316" },
];

const ICON_OPTIONS = [
  { name: "folder", label: "Folder", icon: Folder },
  { name: "layers", label: "Layers", icon: Layers },
  { name: "sparkles", label: "AI/Magic", icon: Sparkles },
  { name: "code", label: "Code", icon: Code2 },
  { name: "briefcase", label: "Business", icon: Briefcase },
  { name: "bookmark", label: "Saved", icon: Bookmark },
  { name: "cpu", label: "Tech", icon: Cpu },
  { name: "hash", label: "Topic", icon: Hash },
];

export function ProjectModal({
  isOpen,
  onClose,
  onSuccess,
  projectToEdit,
}: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("folder");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || "");
      setColor(projectToEdit.color || "#6366f1");
      setIcon(projectToEdit.icon || "folder");
    } else {
      setName("");
      setDescription("");
      setColor("#6366f1");
      setIcon("folder");
    }
    setError("");
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Workspace name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (projectToEdit) {
        const res = await updateProject(projectToEdit.id, {
          name: cleanName,
          description: description.trim() || undefined,
          color,
          icon,
        });
        if (!res.success || !res.project) {
          setError(res.error || "Failed to update workspace.");
          setLoading(false);
          return;
        }
        onSuccess(res.project);
      } else {
        const res = await createProject({
          name: cleanName,
          description: description.trim() || undefined,
          color,
          icon,
        });
        if (!res.success || !res.project) {
          setError(res.error || "Failed to create workspace.");
          setLoading(false);
          return;
        }
        onSuccess(res.project);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Folder className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {projectToEdit ? "Edit Workspace" : "New Workspace"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Organize related prompts into structured projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Workspace Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Campaigns, Python Scripts"
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what belongs in this project..."
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Color Scheme Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Accent Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    color === c.value ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((ic) => {
                const IconComponent = ic.icon;
                const isSelected = icon === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span className="truncate">{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {loading ? "Saving..." : projectToEdit ? "Update Workspace" : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
