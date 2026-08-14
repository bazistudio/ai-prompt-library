"use client";

import { useState, useEffect } from "react";
import { SettingsSection } from "./SettingsSection";
import {
  HardDrive,
  Database,
  FolderOpen,
  FolderEdit,
  CheckCircle2,
  Layers,
  Clock,
} from "lucide-react";

export function StorageSettings() {
  const [dbInfo, setDbInfo] = useState<{
    path: string;
    sizeFormatted: string;
    mode: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined" && (window as any).electron?.db?.getInfo) {
      (window as any).electron.db
        .getInfo()
        .then((info: any) => {
          if (isMounted) setDbInfo(info);
        })
        .catch(console.error)
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenFolder = async () => {
    if (typeof window !== "undefined" && (window as any).electron?.db?.openFolder) {
      try {
        await (window as any).electron.db.openFolder();
      } catch (err) {
        console.error("Open folder error:", err);
      }
    }
  };

  const handleChangeLocation = async () => {
    if (typeof window !== "undefined" && (window as any).electron?.db?.selectFolder) {
      try {
        const result = await (window as any).electron.db.selectFolder();
        if (!result.canceled && result.filePaths.length > 0) {
          const newFolder = result.filePaths[0];
          await (window as any).electron.db.setBackupPath(newFolder);
          setMessage(`Storage location updated to: ${newFolder}`);
          setTimeout(() => setMessage(null), 4000);
        }
      } catch (err) {
        console.error("Select folder error:", err);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Desktop SQLite Storage Location */}
      <SettingsSection
        title="Desktop Storage Location (SQLite)"
        description="Single local source of truth for your desktop prompt library and version histories."
      >
        <div className="glass-card p-6 rounded-2xl border border-primary/40 space-y-5 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Local SQLite Database</h3>
                <span className="text-[10px] text-muted-foreground">
                  {dbInfo?.mode || "SQLite (WAL Mode)"}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-status-online text-status-online-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active Local DB
            </span>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold">
              {message}
            </div>
          )}

          {/* Database Path Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Current Database File Path:
            </label>
            <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-foreground break-all">
              {loading
                ? "Loading database path..."
                : dbInfo?.path || "C:\\Users\\Bazi\\AppData\\Roaming\\ai-prompt-library\\prompt_library.db"}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-border/40">
            <button
              onClick={handleChangeLocation}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary cursor-pointer"
            >
              <FolderEdit className="h-4 w-4" />
              <span>Change Storage Location</span>
            </button>

            <button
              onClick={handleOpenFolder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Open Storage Folder</span>
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* 2. Storage Engines Comparison */}
      <SettingsSection
        title="Storage Engines Overview"
        description="Comparison between current offline local storage and future cloud synchronization."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SQLite Card */}
          <div className="glass-card p-5 rounded-2xl border border-primary/30 flex flex-col justify-between gap-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <HardDrive className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Current Desktop MVP
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">SQLite (Offline Core)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stores all prompts, tags, categories, and immutable version histories locally with 100% offline access.
              </p>
            </div>
          </div>

          {/* MongoDB Card */}
          <div className="glass-card p-5 rounded-2xl border border-border flex flex-col justify-between gap-4 bg-card/40 opacity-70">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Frozen SaaS Version
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">MongoDB (Cloud SaaS)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reserved for future online accounts, multi-device synchronization, and web app subscriptions.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
