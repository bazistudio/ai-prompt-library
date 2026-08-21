import { FileX, History, Layers, ShieldCheck, ArrowRight } from "lucide-react";

export function LandingWhySection() {
  const problems = [
    {
      icon: FileX,
      title: "Stop losing your best prompts",
      description:
        "Your hard-earned system prompts, instructions, and engineering templates shouldn't be scattered across old chat histories, browser tabs, or temporary text files.",
    },
    {
      icon: History,
      title: "Keep improving instead of rewriting",
      description:
        "Prompt versioning lets you refine your prompts over time while preserving every past iteration so you can safely revert or compare changes.",
    },
    {
      icon: Layers,
      title: "Build your own prompt workspace",
      description:
        "Structure your library with custom categories, tags, projects, and multi-step workflow pipelines designed for serious AI workflows.",
    },
    {
      icon: ShieldCheck,
      title: "Work 100% privately offline",
      description:
        "Your prompt database stays strictly on your computer in a local SQLite file. No cloud servers store your prompt intellectual property.",
    },
  ];

  return (
    <section className="py-20 bg-background border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Why AI Prompt Library?
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            A dedicated workspace for your AI prompts
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Built specifically for AI professionals, developers, writers, and creators who need a structured, reliable local prompt library.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
