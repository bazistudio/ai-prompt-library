import { ShieldAlert, Terminal, Users, Database } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of the application instance.</p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl border border-border bg-info/10 text-info flex items-center gap-3 text-sm">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p><strong>Note:</strong> Super Admin authentication and authorization are not enforced in this Phase A UI scaffold. No backend queries are executed.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0</span>
          <span className="text-xs font-medium text-muted-foreground">Total Users</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success mb-1">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0</span>
          <span className="text-xs font-medium text-muted-foreground">Active Users</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center text-info mb-1">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0</span>
          <span className="text-xs font-medium text-muted-foreground">Demo Accounts</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 mb-1">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0</span>
          <span className="text-xs font-medium text-muted-foreground">Total Prompts</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-1">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0</span>
          <span className="text-xs font-medium text-muted-foreground">Prompts Today</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-1">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0 MB</span>
          <span className="text-xs font-medium text-muted-foreground">DB Size</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center space-y-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-1">
            <Terminal className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">0</span>
          <span className="text-xs font-medium text-muted-foreground">System Errors</span>
        </div>
      </div>
    </div>
  );
}
