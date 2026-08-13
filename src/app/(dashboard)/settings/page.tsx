"use client";

import { useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { AboutSettings } from "@/components/settings/AboutSettings";
import { ComingSoonSettings } from "@/components/settings/ComingSoonSettings";
import { Palette, PenTool, Library, User, Database, Info } from "lucide-react";

type SettingsTab = "appearance" | "editor" | "library" | "account" | "storage" | "about";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  const tabs = [
    { id: "appearance", label: "Appearance", icon: Palette, enabled: true },
    { id: "editor", label: "Prompt Editor", icon: PenTool, enabled: false },
    { id: "library", label: "Library", icon: Library, enabled: false },
    { id: "account", label: "Account", icon: User, enabled: false },
    { id: "storage", label: "Storage", icon: Database, enabled: false },
    { id: "about", label: "About", icon: Info, enabled: true },
  ] as const;

  const renderActiveSection = () => {
    switch (activeTab) {
      case "appearance":
        return <AppearanceSettings />;
      case "about":
        return <AboutSettings />;
      case "editor":
        return <ComingSoonSettings title="Prompt Editor Settings" />;
      case "library":
        return <ComingSoonSettings title="Library Preferences" />;
      case "account":
        return <ComingSoonSettings title="Account Preferences" />;
      case "storage":
        return <ComingSoonSettings title="Storage Preferences" />;
      default:
        return <AppearanceSettings />;
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
      <div className="text-left">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Column: Sidebar Navigation */}
        <nav className="w-full md:w-64 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-4 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (!tab.enabled) {
              return (
                <div
                  key={tab.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold text-muted-foreground/45 border-l-2 border-transparent bg-transparent cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/40 border border-border">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold border-l-2 transition-all cursor-pointer text-left w-full ${
                  isActive
                    ? "bg-secondary text-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Column: Active Preferences Section Content */}
        <div className="flex-grow w-full bg-card/10 border border-border/30 rounded-2xl p-6 min-h-[400px]">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
