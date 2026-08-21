"use client";

import Image from "next/image";
import { Sparkles, ArrowRight, Monitor, CheckCircle2 } from "lucide-react";
import { landingConfig } from "@/config/landingConfig";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function LandingHero() {
  return (
    <section className="relative pt-16 pb-20 overflow-hidden bg-background border-b border-border/40">
      {/* Background Soft Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 text-center flex flex-col items-center justify-center space-y-10 relative z-10">
        {/* Eyebrow Version Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border text-foreground text-xs font-semibold shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>AI Prompt Library v{landingConfig.version}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="text-muted-foreground">Offline-First Windows Workspace</span>
        </div>

        {/* Hero Title & Subtitle Container */}
        <div className="max-w-3xl w-full mx-auto space-y-5 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] text-center w-full">
            Your Private{" "}
            <span className="brand-text-gradient">
              AI Prompt Workspace
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl w-full text-center leading-relaxed text-balance mx-auto">
            {landingConfig.heroSubtitle}
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md w-full mx-auto">
          <a
            href="#pricing"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-lg shadow-primary/25 cursor-pointer group"
          >
            <span>Get AI Prompt Library</span>
            <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href={landingConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            <GithubIcon className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>100% Local SQLite Storage</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>No Cloud Dependency</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Windows Desktop Native</span>
          </span>
        </div>

        {/* Main Product Screenshot Window Showcase */}
        <div className="pt-6 w-full">
          <div className="relative max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/90 shadow-2xl overflow-hidden glass-card">
            {/* Desktop Window Title Bar */}
            <div className="px-4 py-3 border-b border-border/60 bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-background/60 px-3 py-1 rounded-md border border-border/40">
                <Monitor className="h-3 w-3 text-primary" />
                <span>AI Prompt Library v{landingConfig.version} — Local Workspace</span>
              </div>

              <div className="w-12" />
            </div>

            {/* Application Screenshot */}
            <div className="relative aspect-[16/10] w-full bg-background overflow-hidden">
              <Image
                src="/images/screenshots/dashboard.png"
                alt="AI Prompt Library Real Application Dashboard Showcase"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
