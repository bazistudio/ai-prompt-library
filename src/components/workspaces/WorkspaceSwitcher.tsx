"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Folder,
  Layers,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  LayoutGrid,
} from "lucide-react";
import { ProjectItem, fetchProjects, deleteProject } from "@/services/projects/projectService";
import { ProjectModal } from "./ProjectModal";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeProjectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadProjects = useCallback(async () => {
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSelectProject = (projectId: string) => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set("projectId", projectId);
    } else {
      params.delete("projectId");
    }
    const target = pathname.startsWith("/prompts") ? pathname : "/prompts";
    router.push(`${target}?${params.toString()}`);
  };

  const handleOpenCreateModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToEdit(null);
    setIsOpen(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setIsOpen(false);
    setModalOpen(true);
  };

  const handleDeleteProject = async (project: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.is_default || project.id === "proj_default") return;
    if (!confirm(`Are you sure you want to delete "${project.name}"? Prompts in this workspace will be moved to the General Workspace.`)) {
      return;
    }

    try {
      const res = await deleteProject(project.id);
      if (res.success) {
        await loadProjects();
        if (activeProjectId === project.id) {
          handleSelectProject("");
        }
      } else {
        alert(res.error || "Failed to delete workspace.");
      }
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    }
  };

  const handleProjectSaved = async (saved: ProjectItem) => {
    await loadProjects();
    handleSelectProject(saved.id);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-xl bg-card border border-border/80 hover:border-primary/40 text-foreground transition-all shadow-xs cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: activeProject ? activeProject.color : "#6366f1" }}
          >
            {activeProject ? (
              <Folder className="h-3.5 w-3.5" />
            ) : (
              <Layers className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="text-left truncate">
            <span className="text-[10px] text-muted-foreground block leading-tight uppercase tracking-wider font-semibold">
              Workspace
            </span>
            <span className="text-xs font-bold text-foreground truncate block">
              {activeProject ? activeProject.name : "All Workspaces"}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl py-1 text-foreground animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
          {/* Header */}
          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60">
            Select Workspace
          </div>

          {/* All Workspaces Option */}
          <button
            onClick={() => handleSelectProject("")}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors hover:bg-muted cursor-pointer ${
              !activeProjectId ? "text-primary font-bold bg-primary/5" : "text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">All Workspaces</span>
            </div>
            {!activeProjectId && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          {/* Project List */}
          {projects.map((proj) => {
            const isSelected = activeProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => handleSelectProject(proj.id)}
                className={`group flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-muted cursor-pointer ${
                  isSelected ? "text-primary font-bold bg-primary/5" : "text-foreground font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span className="truncate">{proj.name}</span>
                  {typeof proj.prompt_count === "number" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {proj.prompt_count}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Action icons on hover */}
                  <div className="hidden group-hover:flex items-center gap-0.5 mr-1">
                    <button
                      onClick={(e) => handleOpenEditModal(proj, e)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80"
                      title="Edit workspace"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    {!proj.is_default && proj.id !== "proj_default" && (
                      <button
                        onClick={(e) => handleDeleteProject(proj, e)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete workspace"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
              </div>
            );
          })}

          {/* Create New Workspace */}
          <div className="p-1.5 border-t border-border/60 mt-1">
            <button
              onClick={handleOpenCreateModal}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleProjectSaved}
        projectToEdit={projectToEdit}
      />
    </div>
  );
}
