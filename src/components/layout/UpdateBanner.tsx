"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, ArrowUpCircle, X, AlertCircle } from "lucide-react";
import { UpdateStatusData } from "@/types/electron";
import { UpdateStatusModal } from "@/components/modals/UpdateStatusModal";

export function UpdateBanner() {
  const [updateData, setUpdateData] = useState<UpdateStatusData>({ status: "idle" });
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      console.log("[UpdateBanner] Status update received:", data);
      setUpdateData(data);
      if (data.status === "downloaded" || data.status === "downloading" || data.status === "available" || data.status === "error") {
        setDismissed(false); // Reveal banner when update action occurs
      }
      if (data.status === "not-available") {
        // Auto hide up-to-date message after 4s
        setTimeout(() => setDismissed(true), 4000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (dismissed || updateData.status === "idle") {
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

  const handleCheckAgain = () => {
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates();
    }
  };

  return (
    <>
      <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs text-foreground animate-in fade-in duration-300">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowDetailModal(true)}>
          {updateData.status === "checking" && (
            <>
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              <span className="text-muted-foreground">Checking for updates...</span>
            </>
          )}

          {(updateData.status === "available" || updateData.status === "downloading") && (
            <>
              <Download className="h-4 w-4 text-primary animate-pulse" />
              <span>
                <strong className="text-primary font-bold">Update Available:</strong> AI Prompt Library {updateData.version ? `v${updateData.version}` : ""} is downloading in background...{" "}
                {updateData.percent !== undefined ? `(${Math.round(updateData.percent)}%)` : ""}
              </span>
            </>
          )}

          {updateData.status === "downloaded" && (
            <>
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">
                <strong className="text-emerald-500 font-bold">Update Ready:</strong> AI Prompt Library {updateData.version ? `v${updateData.version}` : ""} has been downloaded and is ready to install.
              </span>
            </>
          )}

          {updateData.status === "not-available" && (
            <>
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground font-medium">
                You&apos;re up to date — v{updateData.version || "1.0.1"}
              </span>
            </>
          )}

          {updateData.status === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Unable to check for updates automatically.
              </span>
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
                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm text-xs"
              >
                Install Now
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-2.5 py-1 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
                title="Install on Next Launch"
              >
                Install Later
              </button>
            </>
          )}

          {updateData.status === "error" && (
            <button
              onClick={handleCheckAgain}
              className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              Check Again
            </button>
          )}

          {(updateData.status === "downloading" || updateData.status === "available" || updateData.status === "not-available") && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Detailed Status Modal */}
      <UpdateStatusModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        updateStatus={updateData}
        onCheckAgain={handleCheckAgain}
        onInstallNow={handleInstallNow}
      />
    </>
  );
}
