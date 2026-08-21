import {
  BookOpen,
  History,
  FileCode,
  Workflow,
  Sparkles,
  Folder,
  Database,
  Archive,
  Lock,
  CheckCircle,
} from "lucide-react";

export function LandingFeatureGrid() {
  const features = [
    {
      icon: BookOpen,
      title: "Prompt Categorization & Tags",
      description: "Organize prompts into built-in or custom categories with search tags for instant recall.",
    },
    {
      icon: History,
      title: "Immutable Version Logging",
      description: "Every edit is recorded as a new version with change summaries and restore capabilities.",
    },
    {
      icon: FileCode,
      title: "Rich Markdown Editor",
      description: "Full markdown formatting, code block syntax, raw view toggle, and auto/RTL text direction.",
    },
    {
      icon: Workflow,
      title: "Prompt Workflows & Chains",
      description: "Chain multiple prompts sequentially into automated pipelines with provider & model parameters.",
    },
    {
      icon: Sparkles,
      title: "AI Live Playground",
      description: "Test and execute prompts directly against Gemini AI models with variable replacement.",
    },
    {
      icon: Folder,
      title: "Workspaces & Projects",
      description: "Group prompts into color-coded projects to keep client and personal prompt sets distinct.",
    },
    {
      icon: Database,
      title: "Offline SQLite Storage",
      description: "All prompt documents are stored locally using better-sqlite3 with zero cloud requirement.",
    },
    {
      icon: Archive,
      title: "Local Database Backup",
      description: "Create ZIP database backups on demand or configure automatic retention schedules.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-background border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Verified Features
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need for serious prompt engineering
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All features listed are fully implemented and available in the v1.0.3 application.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="glass-card p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
