import { getSession } from "@/auth/online/session";
import { getPromptStats } from "@/database/local/promptStore";
import { Terminal, Star, Layers, Folder, Database, Cpu, Activity, Plus, ArrowRight, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { BatchExportImportTrigger } from "@/components/prompts/BatchExportImportModal";

export default async function DashboardPage() {
  const isElectron = process.env.IS_ELECTRON === "true" || process.env.NEXT_PUBLIC_IS_ELECTRON === "true";
  const session = isElectron ? null : await getSession();
  const username = isElectron ? "Local Workspace" : (session?.username || "Developer");

  let stats = {
    totalPrompts: 0,
    favoritePrompts: 0,
    totalCategories: 8,
    totalVersions: 0,
    recentPrompts: [] as Array<{
      id: string;
      title: string;
      description?: string;
      category: string;
      current_version: number;
      is_favorite: boolean;
      updated_at: number;
    }>,
  };

  try {
    stats = getPromptStats();
  } catch (err) {
    console.error("Failed to load prompt stats on dashboard:", err);
  }

  const metrics = [
    {
      name: "Total Prompts",
      value: stats.totalPrompts,
      icon: Terminal,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      name: "Favorite Prompts",
      value: stats.favoritePrompts,
      icon: Star,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
    },
    {
      name: "Categories",
      value: stats.totalCategories,
      icon: Folder,
      color: "text-info",
      bg: "bg-info/10",
      border: "border-info/20",
    },
    {
      name: "Logged Versions",
      value: stats.totalVersions,
      icon: Layers,
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    },
  ];

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-10 space-y-10 text-left">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to {username}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your prompts and templates from your central offline hub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/prompts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Prompt</span>
          </Link>

          <BatchExportImportTrigger />

          {isElectron ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/10 border border-info/30 text-info text-xs font-semibold self-start sm:self-auto shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
              Offline Desktop Mode
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-online text-status-online-foreground text-xs font-semibold self-start sm:self-auto shadow-sm shadow-primary/5">
              <span className="h-1.5 w-1.5 rounded-full bg-status-online-foreground animate-pulse" />
              Offline SQLite Active
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.name}
              className={`glass-card p-6 rounded-2xl border ${m.border} flex flex-col gap-4 relative overflow-hidden bg-card`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{m.name}</span>
                <div className={`h-8 w-8 rounded-lg ${m.bg} flex items-center justify-center ${m.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <span className="text-3xl font-extrabold text-foreground tracking-tight">{m.value}</span>
            </div>
          );
        })}
      </div>

      {/* Analytics Dashboard (Charts & Insights) */}
      <AnalyticsDashboard />

      {/* Recent Prompts Section */}
      <div className="glass-card p-6 rounded-2xl border border-border space-y-4 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Recent Prompts
            </h2>
          </div>
          <Link
            href="/prompts"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentPrompts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-muted-foreground">No prompts created yet.</p>
            <Link
              href="/prompts/new"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create your first prompt</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.recentPrompts.map((p) => (
              <Link
                key={p.id}
                href={`/prompts/${p.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-card transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {p.title}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                        v{p.current_version}
                      </span>
                    </div>
                    {p.description && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {p.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground hidden sm:inline">
                    {p.category}
                  </span>
                  <span className="text-[10px] flex items-center gap-1 hidden md:inline-flex">
                    <Clock className="h-3 w-3" />
                    {formatDate(p.updated_at)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Most Used Prompts Section (Analytics Phase A) */}
      <div className="glass-card p-6 rounded-2xl border border-border space-y-4 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Most Used Prompts
            </h2>
          </div>
        </div>

        <div className="py-8 text-center space-y-2">
          <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Activity className="h-5 w-5 text-primary/50" />
          </div>
          <p className="text-xs font-semibold text-foreground">No usage data yet</p>
          <p className="text-[11px] text-muted-foreground">Prompt execution and usage statistics will appear here.</p>
        </div>
      </div>

      {/* System Engine Status Panel */}
      <div className="glass-card-glow p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Offline AI Workspace Operational
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The local SQLite database, file-based prompt sync engine, dynamic category manager, and application security shields are fully synchronized and active.
          </p>

          <div className="border-t border-border pt-6 grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center text-info">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">SQLite Storage Engine</span>
                <span className="text-[10px] text-muted-foreground">Primary local database active</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Cloud Sync Readiness</span>
                <span className="text-[10px] text-muted-foreground">MongoDB & Session schemas preserved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
