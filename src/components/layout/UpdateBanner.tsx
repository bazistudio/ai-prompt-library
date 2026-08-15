"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, ArrowUpCircle, X } from "lucide-react";

import { UpdateStatusData } from "@/types/electron";

export function UpdateBanner() {
  const [updateData, setUpdateData] = useState<UpdateStatusData>({ status: "idle" });
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.updater) {
      return;
    }

    const updater = window.electronAPI.updater;

    // Get current status on mount
    updater.getUpdateStatus().then((initial) => {
      if (initial && initial.status !== "idle") {
        setUpdateData(initial);
      }
    }).catch(() => {});

    // Listen for live updates
    const unsubscribe = updater.onStatus((data) => {
      console.log("[UpdateBanner] Status update:", data);
      setUpdateData(data);
      if (data.status === "downloaded" || data.status === "downloading") {
        setDismissed(false); // Make visible when active download/downloaded status arrives
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (dismissed || updateData.status === "idle" || updateData.status === "not-available") {
    return null;
  }

  const handleInstallNow = async () => {
    if (window.electronAPI?.updater) {
      setInstalling(true);
      try {
        await window.electronAPI.updater.installNow();
      } catch (err) {
        console.error("Failed to trigger installNow:", err);
        setInstalling(false);
      }
    }
  };

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs text-foreground animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        {updateData.status === "downloading" && (
          <>
            <Download className="h-4 w-4 text-primary animate-pulse" />
            <span>
              Downloading update {updateData.version ? `v${updateData.version}` : ""}...{" "}
              {updateData.percent !== undefined ? `${Math.round(updateData.percent)}%` : ""}
            </span>
          </>
        )}

        {updateData.status === "downloaded" && (
          <>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
            <span className="font-medium">
              AI Prompt Library {updateData.version ? `v${updateData.version}` : "Update"} is ready to install.
            </span>
          </>
        )}

        {updateData.status === "checking" && (
          <>
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            <span className="text-muted-foreground">Checking for updates...</span>
          </>
        )}

        {installing && (
          <>
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            <span className="font-semibold text-primary">Installing update and restarting...</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {updateData.status === "downloaded" && !installing && (
          <>
            <button
              onClick={handleInstallNow}
              className="px-2.5 py-1 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
            >
              Install Now
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Install on Next Launch"
            >
              Install on Next Launch
            </button>
          </>
        )}

        {updateData.status === "downloading" && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Hide progress"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
