"use client";

import { useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { PromptEditorSettings } from "@/components/settings/PromptEditorSettings";
import { LibrarySettings } from "@/components/settings/LibrarySettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { AISettings } from "@/components/settings/AISettings";
import { AboutSettings } from "@/components/settings/AboutSettings";
import { LicenseSettings } from "@/components/settings/LicenseSettings";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { Palette, PenTool, Library, User, Database, Info, ShieldCheck, Bot, Archive, RotateCcw } from "lucide-react";

type SettingsTab = "appearance" | "editor" | "library" | "ai" | "account" | "storage" | "backup" | "license" | "about";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  const tabs = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "editor", label: "Prompt Editor", icon: PenTool },
    { id: "library", label: "Library", icon: Library },
    { id: "ai", label: "AI & Models", icon: Bot },
    { id: "account", label: "Account", icon: User },
    { id: "storage", label: "Storage", icon: Database },
    { id: "backup", label: "Backup & Restore", icon: Archive },
    { id: "license", label: "License & Edition", icon: ShieldCheck },
    { id: "about", label: "About", icon: Info },
  ] as const;

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default? This cannot be undone.")) {
      const keys = [
        "pref-theme",
        "pref-primary-color",
        "pref-accent-color",
        "pref-accent-highlights",
        "pref-reduce-animations",
        "ai-prompt-library:editor-preferences",
        "ai-prompt-library:library-preferences",
        "ai_prompt_library_ai_settings_v1"
      ];
      keys.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case "appearance":
        return <AppearanceSettings />;
      case "editor":
        return <PromptEditorSettings />;
      case "library":
        return <LibrarySettings />;
      case "ai":
        return <AISettings />;
      case "account":
        return <AccountSettings />;
      case "storage":
        return <StorageSettings />;
      case "backup":
        return <BackupSettings />;
      case "license":
        return <LicenseSettings />;
      case "about":
        return <AboutSettings />;
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

          <div className="mt-4 pt-4 border-t border-border/50">
            <button
              onClick={handleResetSettings}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10 transition-all cursor-pointer text-left w-full border-l-2 border-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset All Settings</span>
            </button>
          </div>
        </nav>

        {/* Right Column: Active Preferences Section Content */}
        <div className="flex-grow w-full bg-card/10 border border-border/30 rounded-2xl p-6 min-h-[400px]">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
