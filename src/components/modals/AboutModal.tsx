"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X, ShieldCheck } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckForUpdates?: () => void;
}

export function AboutModal({ isOpen, onClose, onCheckForUpdates }: AboutModalProps) {
  const [appInfo, setAppInfo] = useState<{ version: string; platform: string; arch: string }>({
    version: "1.0.1",
    platform: "win32",
    arch: "x64",
  });
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI?.getAppInfo) {
      window.electronAPI.getAppInfo().then((info) => {
        if (info) setAppInfo(info);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckUpdateClick = () => {
    setCheckingUpdate(true);
    if (onCheckForUpdates) {
      onCheckForUpdates();
    } else if (typeof window !== "undefined" && window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates();
    }
    setTimeout(() => setCheckingUpdate(false), 2000);
  };

  const getPlatformLabel = (plat: string) => {
    if (plat === "win32") return "Windows (x64)";
    if (plat === "darwin") return "macOS";
    if (plat === "linux") return "Linux";
    return plat;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-border shadow-2xl space-y-6 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Branding */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Prompt Library</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                v{appInfo.version}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Offline First
              </span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your secure offline workspace for AI prompts, projects, notes, guides, tasks, and team knowledge.
        </p>

        <hr className="border-border/60" />

        {/* Metadata Grid */}
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground font-medium">Application Version</span>
            <span className="font-mono font-bold text-foreground">{appInfo.version}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground font-medium">Operating System</span>
            <span className="font-semibold text-foreground">{getPlatformLabel(appInfo.platform)}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground font-medium">Storage Architecture</span>
            <span className="font-semibold text-foreground">Local SQLite + File System</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground font-medium">Release Channel</span>
            <span className="font-semibold text-primary">Stable</span>
          </div>
        </div>

        <hr className="border-border/60" />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground font-medium">
            © 2026 AI Prompt Library
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckUpdateClick}
              disabled={checkingUpdate}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checkingUpdate ? "animate-spin text-primary" : ""}`} />
              <span>{checkingUpdate ? "Checking..." : "Check for Updates"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
