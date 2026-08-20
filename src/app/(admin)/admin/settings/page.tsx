import { Save, Info } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure global application behavior.</p>
      </div>

      <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning flex items-center gap-3 text-sm">
        <Info className="h-5 w-5 shrink-0" />
        <p><strong>Read-Only Mode:</strong> Settings cannot be modified in the current UI scaffold phase.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-border bg-card space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Instance Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">App Name</label>
              <input
                type="text"
                disabled
                defaultValue="AI Prompt Library"
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Environment</label>
              <input
                type="text"
                disabled
                defaultValue="Production (Offline-First)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 flex justify-end">
          <button disabled className="px-4 py-2 rounded-xl bg-primary/50 text-primary-foreground text-xs font-semibold flex items-center gap-2 cursor-not-allowed">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
