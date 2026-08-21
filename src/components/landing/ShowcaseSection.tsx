"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen, LayoutDashboard, Workflow, ShieldCheck, Monitor } from "lucide-react";

export function LandingShowcaseSection() {
  const [activeTab, setActiveTab] = useState<"library" | "dashboard" | "workflows" | "settings">("library");

  const tabs = [
    {
      id: "library" as const,
      label: "Prompt Library & Search",
      icon: BookOpen,
      image: "/images/screenshots/prompt-library.png",
      title: "Organized Prompt Library & Quick Search",
      description:
        "Filter prompts by custom categories, search by tags or text content, and star your favorite prompt templates.",
    },
    {
      id: "dashboard" as const,
      label: "Workspace Dashboard",
      icon: LayoutDashboard,
      image: "/images/screenshots/dashboard.png",
      title: "Central Workspace Dashboard & Analytics",
      description:
        "Track total prompts, favorite items, categories, and version counts from a clean offline dashboard.",
    },
    {
      id: "workflows" as const,
      label: "Workflows & Pipelines",
      icon: Workflow,
      image: "/images/screenshots/workflows.png",
      title: "Multi-Step Prompt Execution Chains",
      description:
        "Chain prompts sequentially so the output of one step seamlessly feeds the next LLM step.",
    },
    {
      id: "settings" as const,
      label: "Backup & Security",
      icon: ShieldCheck,
      image: "/images/screenshots/settings.png",
      title: "Local Database Backup & Security Lock",
      description:
        "Export database backups, configure automatic periodic snapshots, and protect your workspace with PIN lock.",
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section id="showcase" className="py-20 bg-card/20 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-10">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Product Showcase
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            See the real application in action
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Actual interface screenshots captured directly from AI Prompt Library v1.0.3 running on desktop.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Frame & Description */}
        <div className="space-y-6">
          <div className="max-w-3xl mx-auto text-center space-y-1">
            <h3 className="text-lg font-bold text-foreground">{currentTab.title}</h3>
            <p className="text-xs text-muted-foreground">{currentTab.description}</p>
          </div>

          <div className="relative max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden glass-card">
            {/* Title Bar */}
            <div className="px-4 py-2.5 border-b border-border/60 bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <Monitor className="h-3 w-3 text-primary" />
                <span>{currentTab.label} — AI Prompt Library v1.0.3</span>
              </div>
              <div className="w-10" />
            </div>

            {/* Real Screenshot */}
            <div className="relative aspect-[16/10] w-full bg-background overflow-hidden">
              <Image
                src={currentTab.image}
                alt={currentTab.title}
                fill
                className="object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
