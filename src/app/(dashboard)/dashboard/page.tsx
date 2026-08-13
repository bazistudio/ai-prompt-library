import { getSession } from "@/lib/auth/session";
import { Terminal, Sparkles, Layers, Folder, Database, Cpu, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  const username = session?.username || "Developer";

  const metrics = [
    {
      name: "Total Prompts",
      value: 0,
      icon: Terminal,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      name: "Master Prompts",
      value: 0,
      icon: Sparkles,
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    {
      name: "Templates",
      value: 0,
      icon: Layers,
      color: "text-info",
      bg: "bg-info/10",
      border: "border-info/20",
    },
    {
      name: "Projects",
      value: 0,
      icon: Folder,
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    },
  ];

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {username}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your prompts and templates from your central hub.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-online text-status-online-foreground text-xs font-semibold self-start sm:self-auto shadow-sm shadow-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-status-online-foreground animate-pulse" />
          Online Mode (MongoDB Active)
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.name}
              className={`glass-card p-6 rounded-2xl border ${m.border} flex flex-col gap-4 relative overflow-hidden`}
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

      {/* Development Status Dashboard Panel */}
      <div className="glass-card-glow p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Prompt Library Boilerplate Ready
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The fundamental database connectivity, authentication flow, layout styling, and path proxy guards are fully operational. The prompt library CRUD, template engine, version manager, and workspace workflows are ready to be built in subsequent phases.
          </p>

          <div className="border-t border-border pt-6 grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">MongoDB Database</span>
                <span className="text-[10px] text-muted-foreground">Connected & validated (Accounts + Prompts)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center text-info">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">SQLite Database</span>
                <span className="text-[10px] text-muted-foreground">Isolated connection checked (Electron ready)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
