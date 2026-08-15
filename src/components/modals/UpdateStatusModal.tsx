"use client";

import { X, ArrowUpCircle, RefreshCw, CheckCircle2, AlertCircle, DownloadCloud } from "lucide-react";
import { UpdateStatusData } from "@/types/electron";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateStatus: UpdateStatusData;
  onCheckAgain: () => void;
  onInstallNow: () => void;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  updateStatus,
  onCheckAgain,
  onInstallNow,
}: UpdateStatusModalProps) {
  if (!isOpen) return null;

  const isDownloading = updateStatus.status === "downloading";
  const isDownloaded = updateStatus.status === "downloaded";
  const isChecking = updateStatus.status === "checking";
  const isAvailable = updateStatus.status === "available";
  const isError = updateStatus.status === "error";
  const isUpToDate = updateStatus.status === "not-available";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-border shadow-2xl space-y-5 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${
              isDownloaded
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : isDownloading || isAvailable
                ? "bg-primary/10 text-primary border-primary/30"
                : isError
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                : "bg-secondary text-foreground border-border"
            }`}
          >
            {isDownloaded ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : isDownloading ? (
              <DownloadCloud className="h-6 w-6 animate-pulse" />
            ) : isError ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <ArrowUpCircle className="h-6 w-6 text-primary" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground">
              {isDownloaded
                ? "Update Ready to Install"
                : isDownloading
                ? "Downloading Update..."
                : isAvailable
                ? "New Version Available"
                : isError
                ? "Update Check Unavailable"
                : isUpToDate
                ? "Application is Up to Date"
                : "Checking for Updates"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {updateStatus.version ? `AI Prompt Library v${updateStatus.version}` : "Desktop Shell Update Manager"}
            </p>
          </div>
        </div>

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="space-y-2 p-4 rounded-xl bg-secondary/40 border border-border">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-foreground">Downloading v{updateStatus.version || "update"}</span>
              <span className="text-primary font-mono font-bold">
                {Math.round(updateStatus.percent || 0)}%
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, updateStatus.percent || 0))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Background update download</span>
              <span>{Math.round(updateStatus.percent || 0)}% downloaded</span>
            </div>
          </div>
        )}

        {/* Downloaded State */}
        {isDownloaded && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Download Complete
            </p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 leading-relaxed">
              AI Prompt Library v{updateStatus.version} has been downloaded and is ready to install. Click <strong>Install Now</strong> to apply the update immediately, or choose <strong>Install Later</strong> to update automatically when you next launch the app.
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Unable to check for updates
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
              {updateStatus.error || "Could not reach the update server. Please check your network connection and try again."}
            </p>
          </div>
        )}

        {/* Up to Date State */}
        {isUpToDate && (
          <div className="p-4 rounded-xl bg-secondary/50 border border-border text-xs text-foreground space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" /> You&apos;re using the latest version
            </p>
            <p className="text-[11px] text-muted-foreground">
              No new updates are available at this time.
            </p>
          </div>
        )}

        {/* Checking State */}
        {isChecking && (
          <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center gap-3 text-xs text-foreground">
            <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />
            <span>Checking update servers for available releases...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {isDownloaded ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Install Later
              </button>
              <button
                type="button"
                onClick={onInstallNow}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 cursor-pointer"
              >
                Install Now
              </button>
            </>
          ) : isError ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onCheckAgain}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Check Again
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
