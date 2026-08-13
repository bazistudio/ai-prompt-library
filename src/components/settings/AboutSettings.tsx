"use client";

import { Terminal, ShieldCheck, ExternalLink, Code, BookOpen, AlertCircle } from "lucide-react";

export function AboutSettings() {
  const stack = [
    { name: "Next.js", desc: "React Framework", version: "v16.3" },
    { name: "MongoDB", desc: "Online Storage", version: "v9.9" },
    { name: "SQLite", desc: "Local Storage", version: "v13.0" },
    { name: "Electron", desc: "Desktop Wrapper", version: "Planned" },
  ];

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Hero Logo Branding */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4 bg-secondary/20 p-6 rounded-2xl border border-border">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary">
          <Terminal className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Prompt Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Version 0.1.0 (Boilerplate Foundation Release)
          </p>
        </div>
      </div>

      {/* 2. Build Stack */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Software Build Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stack.map((item) => (
            <div
              key={item.name}
              className="glass-card p-4 rounded-xl border border-border flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{item.desc}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-secondary text-secondary-foreground border border-border">
                {item.version}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Documentation & External Links */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Resources & Support
        </h2>
        <div className="flex flex-col gap-1 border border-border rounded-xl overflow-hidden bg-card">
          <a
            href="https://github.com/bazistudio/ai-prompt-library"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 hover:bg-muted text-sm text-muted-foreground hover:text-foreground border-b border-border transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Code className="h-4.5 w-4.5" />
              <span className="font-semibold">GitHub Repository</span>
            </div>
            <ExternalLink className="h-4 w-4 opacity-55" />
          </a>

          <a
            href="file:///e:/library/prompt-library/README.md"
            className="flex items-center justify-between p-4 hover:bg-muted text-sm text-muted-foreground hover:text-foreground border-b border-border transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-4.5 w-4.5" />
              <span className="font-semibold">Documentation (README.md)</span>
            </div>
            <ExternalLink className="h-4 w-4 opacity-55" />
          </a>

          <a
            href="https://github.com/bazistudio/ai-prompt-library/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4.5 w-4.5" />
              <span className="font-semibold">Report an Issue</span>
            </div>
            <ExternalLink className="h-4 w-4 opacity-55" />
          </a>
        </div>
      </div>

      {/* 4. Footer License & Integrity */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>Developer sandbox session. All prompt credentials secured.</span>
      </div>
    </div>
  );
}
