import { ShieldCheck, Database, KeyRound, HardDrive, Lock } from "lucide-react";

export function LandingPrivacySecuritySection() {
  const securityFacts = [
    {
      icon: HardDrive,
      title: "Local-First Storage",
      description:
        "All prompt data, versions, categories, and settings are stored locally in an isolated SQLite database on your computer.",
    },
    {
      icon: Database,
      title: "No Cloud Dependency",
      description:
        "Your prompt library functions fully offline without needing an active internet connection or external cloud database sync.",
    },
    {
      icon: KeyRound,
      title: "Cryptographic Offline Licensing",
      description:
        "License activation uses asymmetric public-key cryptography to verify your license certificate completely offline.",
    },
    {
      icon: Lock,
      title: "Application Lock & Hash Security",
      description:
        "User credentials are protected using bcrypt password hashing, HTTP-only JWT sessions, and local application lock options.",
    },
  ];

  return (
    <section id="privacy" className="py-20 bg-background border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Offline & Privacy First
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Your prompts. Your computer. Your workspace.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI Prompt Library is designed from the ground up to keep your prompt IP strictly under your control.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          {securityFacts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border border-border bg-card space-y-3"
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
