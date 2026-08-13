"use client";

import { SettingsSection } from "./SettingsSection";
import { Database, HardDrive, ArrowRight, Layers, CheckCircle2, Clock } from "lucide-react";

export function StorageSettings() {
  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Current Active Storage Mode */}
      <SettingsSection
        title="Storage Mode"
        description="The primary data persistence engine for your prompt workspace."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active MongoDB Card */}
          <div className="glass-card-glow p-5 rounded-2xl border border-primary/40 flex flex-col justify-between gap-4 bg-card relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Database className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-status-online text-status-online-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active Storage
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-foreground">MongoDB</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Online cloud database engine for active web application storage during development.
              </p>
            </div>
          </div>

          {/* Prepared SQLite Card */}
          <div className="glass-card p-5 rounded-2xl border border-border flex flex-col justify-between gap-4 bg-card/50 opacity-80">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                <HardDrive className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Electron Prepared
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-foreground">SQLite</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prepared local-file database engine reserved for future Electron desktop bundling.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 2. Hybrid Architecture Preview */}
      <SettingsSection
        title="Hybrid Storage Architecture"
        description="Overview of how data routes interact between the Web application and Desktop shell."
      >
        <div className="glass-card p-6 rounded-2xl border border-border space-y-6 bg-card">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Layers className="h-4 w-4 text-primary" />
            <span>Data Routing Overview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Flow 1: Web App */}
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-secondary/20">
              <span className="text-xs font-bold text-foreground">Current Web Environment</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>Web App</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span>MongoDB</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground">Online Library</span>
              </div>
            </div>

            {/* Flow 2: Desktop App */}
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-secondary/20">
              <span className="text-xs font-bold text-foreground">Future Desktop Release</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>Electron</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent" />
                <span>SQLite</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent" />
                <span className="text-foreground">Local Library</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
            Direct local/online storage mode switching, offline-first workflows, and synchronization will be enabled in Phase 5 when the Electron desktop application is packaged.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
