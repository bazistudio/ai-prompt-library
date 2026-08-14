"use client";

import { useState, useEffect } from "react";
import { SettingsSection } from "./SettingsSection";
import {
  HardDrive,
  FolderOpen,
  FolderEdit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderSync,
  X,
} from "lucide-react";
import {
  getStoragePath,
  selectStorageFolder,
  setStoragePath,
  moveLibrary,
  openStorageFolder,
} from "@/services/storage/storageService";

export function StorageSettings() {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Relocation Modal State
  const [pendingNewPath, setPendingNewPath] = useState<string | null>(null);

  const loadStorage = async () => {
    try {
      const p = await getStoragePath();
      setCurrentPath(p);
    } catch (err) {
      console.error("Failed to load storage path:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const handleSelectOrChange = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await selectStorageFolder();
      if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
        const selected = res.filePaths[0];

        if (currentPath && currentPath !== selected) {
          // Open relocation modal
          setPendingNewPath(selected);
        } else {
          // Direct set for first use or re-selecting same folder
          const saveRes = await setStoragePath(selected);
          if (saveRes.success) {
            setCurrentPath(saveRes.storagePath || selected);
            setMessage({ type: "success", text: `Storage location configured: ${selected}` });
          } else {
            setMessage({ type: "error", text: saveRes.error || "Failed to set storage path." });
          }
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to select folder." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmMove = async (shouldMove: boolean) => {
    if (!pendingNewPath) return;

    const newPath = pendingNewPath;
    setPendingNewPath(null);
    setActionLoading(true);
    setMessage(null);

    try {
      if (shouldMove) {
        // Move Library (Verified Async Copy Contract)
        const res = await moveLibrary(newPath);
        if (res.success) {
          setCurrentPath(res.storagePath || newPath);
          setMessage({ type: "success", text: `Prompt library safely moved and updated to: ${newPath}` });
        } else {
          setMessage({ type: "error", text: res.error || "Failed to move prompt library. Original location kept." });
        }
      } else {
        // Use New Location Without Moving
        const res = await setStoragePath(newPath);
        if (res.success) {
          setCurrentPath(res.storagePath || newPath);
          setMessage({ type: "success", text: `Storage location switched to: ${newPath} (Original files left untouched).` });
        } else {
          setMessage({ type: "error", text: res.error || "Failed to set storage path." });
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update storage location." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    setMessage(null);
    const res = await openStorageFolder();
    if (!res.success) {
      setMessage({ type: "error", text: res.error || "Could not open storage folder." });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Prompt Library Physical Folder Location */}
      <SettingsSection
        title="Prompt Storage Location"
        description="Configure the folder on your computer where your prompt Markdown files and categories are stored."
      >
        <div className="glass-card p-6 rounded-2xl border border-primary/40 space-y-5 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Prompt Library Storage</h3>
                <span className="text-[10px] text-muted-foreground">
                  Offline Local File Engine
                </span>
              </div>
            </div>

            {currentPath ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-status-online text-status-online-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Not Configured
              </span>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                message.type === "success"
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-danger/10 border-danger/20 text-danger"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Current Path Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Current Prompt Library Folder Path:
            </label>
            <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-foreground break-all">
              {loading ? (
                "Loading storage path..."
              ) : currentPath ? (
                currentPath
              ) : (
                <span className="text-muted-foreground italic">
                  Not configured (No prompt files will be written until selected)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-border/40">
            <button
              onClick={handleSelectOrChange}
              disabled={actionLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderEdit className="h-4 w-4" />
              )}
              <span>{currentPath ? "Change Location" : "Choose Folder"}</span>
            </button>

            <button
              onClick={handleOpenFolder}
              disabled={!currentPath}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Open Storage Folder</span>
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Relocation Modal */}
      {pendingNewPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FolderSync className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Change Storage Location</h3>
                  <p className="text-xs text-muted-foreground">Select how existing files should be handled.</p>
                </div>
              </div>
              <button
                onClick={() => setPendingNewPath(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">New location selected:</p>
              <p className="font-mono text-[11px] bg-background p-2 rounded-lg border border-border break-all">
                {pendingNewPath}
              </p>
              <p>Your existing Prompt Library already contains category folders and prompt files.</p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => handleConfirmMove(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                <span>Move Library (Copy & Verify Files)</span>
              </button>

              <button
                onClick={() => handleConfirmMove(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Use New Location Without Moving</span>
              </button>

              <button
                onClick={() => setPendingNewPath(null)}
                className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground py-1 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
