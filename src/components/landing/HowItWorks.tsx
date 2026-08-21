import { PlusCircle, FolderTree, History, Zap } from "lucide-react";

export function LandingHowItWorks() {
  const steps = [
    {
      step: "01",
      icon: PlusCircle,
      title: "Create",
      description: "Write or paste your system prompts, templates, and instructions into the rich editor.",
    },
    {
      step: "02",
      icon: FolderTree,
      title: "Organize",
      description: "Assign categories, search tags, text direction, and group prompts into projects.",
    },
    {
      step: "03",
      icon: History,
      title: "Improve",
      description: "Refine prompts over time. Every save creates an immutable version snapshot with notes.",
    },
    {
      step: "04",
      icon: Zap,
      title: "Reuse",
      description: "Find prompts instantly via ⌘K search, copy to clipboard, or execute in the AI Playground.",
    },
  ];

  return (
    <section className="py-20 bg-card/20 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Simple Workflow
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How AI Prompt Library Works
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Four simple steps to organize your entire prompt collection.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border border-border bg-card relative overflow-hidden space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-extrabold text-primary/40">{s.step}</span>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
