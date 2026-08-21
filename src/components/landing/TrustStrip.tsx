import { Shield, Database, Lock, Cpu, History, Monitor } from "lucide-react";

export function LandingTrustStrip() {
  const trustItems = [
    {
      icon: Cpu,
      title: "Offline-First",
      subtitle: "Runs entirely on your computer",
    },
    {
      icon: Database,
      title: "Local SQLite Storage",
      subtitle: "Fast, reliable file-based database",
    },
    {
      icon: History,
      title: "Version History",
      subtitle: "Preserve every prompt iteration",
    },
    {
      icon: Lock,
      title: "Private & Secure",
      subtitle: "Application lock & local protection",
    },
    {
      icon: Monitor,
      title: "Windows Desktop",
      subtitle: "Built for desktop performance",
    },
  ];

  return (
    <section className="py-8 bg-card/40 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-left">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3 p-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
