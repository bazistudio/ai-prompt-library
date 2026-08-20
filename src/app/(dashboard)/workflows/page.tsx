"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
  WorkflowItem,
} from "@/services/workflows/workflowService";
import {
  Workflow,
  Plus,
  Trash2,
  ArrowRight,
  Search,
  Folder,
} from "lucide-react";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDesc, setNewWorkflowDesc] = useState("");
  const [newWorkflowCategory, setNewWorkflowCategory] = useState("Marketing");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const items = await fetchWorkflows();
      setWorkflows(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setCreating(true);
    try {
      await createWorkflow({
        name: newWorkflowName.trim(),
        description: newWorkflowDesc.trim() || undefined,
        category: newWorkflowCategory,
      });
      setNewWorkflowName("");
      setNewWorkflowDesc("");
      setCreateModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete workflow "${name}"?`)) {
      await deleteWorkflow(id);
      await loadData();
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || w.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(workflows.map((w) => w.category)));

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Workflow className="h-6 w-6 text-primary" />
              <span>Prompt Workflows & Chains</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Phase 7
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Build, test, and automate multi-step prompt pipelines where step outputs feed subsequent LLM models.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md shadow-primary transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Workflow Pipeline</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows & pipelines..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading workflow chains...</span>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-border bg-card text-center space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Workflow className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Workflow Chains Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Combine multiple prompts into an automated sequential execution chain. Step 1 generates ideas, Step 2 structures them, and Step 3 reviews the output.
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Workflow</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkflows.map((wf) => (
            <Link
              key={wf.id}
              href={`/workflows/${wf.id}`}
              className="glass-card p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all group flex flex-col justify-between space-y-4 hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-secondary text-foreground border border-border flex items-center gap-1">
                    <Folder className="h-3 w-3 text-primary" />
                    {wf.category}
                  </span>

                  <button
                    onClick={(e) => handleDelete(wf.id, wf.name, e)}
                    className="p-1 text-muted-foreground hover:text-danger rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    title="Delete workflow"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>{wf.name}</span>
                  </h3>
                  {wf.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {wf.description}
                    </p>
                  )}
                </div>

                {/* Steps preview chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>Pipeline Steps</span>
                    <span className="font-mono">{wf.steps?.length || 0} step(s)</span>
                  </div>

                  <div className="space-y-1">
                    {wf.steps?.slice(0, 3).map((s, idx) => (
                      <div
                        key={s.id}
                        className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-[11px] font-medium text-foreground flex items-center justify-between"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="h-4 w-4 rounded-full bg-primary/10 text-primary font-mono text-[9px] flex items-center justify-center shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <span className="truncate">{s.step_name}</span>
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground capitalize shrink-0 ml-2">
                          {s.provider}
                        </span>
                      </div>
                    ))}
                    {(wf.steps?.length || 0) > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center font-medium">
                        + {(wf.steps?.length || 0) - 3} more step(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom footer */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Open Workflow Studio</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Create Workflow Pipeline</h2>
                <p className="text-xs text-muted-foreground">Define a new multi-step AI execution chain</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Pipeline Name *</label>
                <input
                  type="text"
                  required
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. SEO Article Generator (Outline -> Draft -> Polish)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Category</label>
                <select
                  value={newWorkflowCategory}
                  onChange={(e) => setNewWorkflowCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Coding">Coding</option>
                  <option value="Writing">Writing</option>
                  <option value="Research">Research</option>
                  <option value="Business">Business</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Description (Optional)</label>
                <textarea
                  value={newWorkflowDesc}
                  onChange={(e) => setNewWorkflowDesc(e.target.value)}
                  placeholder="Briefly describe what this sequential prompt chain accomplishes..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newWorkflowName.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-md cursor-pointer disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Pipeline"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
