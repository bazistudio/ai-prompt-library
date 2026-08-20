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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">0</span>
          <span className="text-sm font-medium text-muted-foreground">Total Users</span>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
            <Database className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">0 MB</span>
          <span className="text-sm font-medium text-muted-foreground">Database Size</span>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-2">
            <Terminal className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">0</span>
          <span className="text-sm font-medium text-muted-foreground">System Errors</span>
        </div>
      </div>
    </div>
  );
}
