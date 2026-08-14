"use client";

import { useState } from "react";
import { FolderOpen, HardDrive, X, Loader2 } from "lucide-react";
import { selectStorageFolder, setStoragePath } from "@/services/storage/storageService";

interface FirstUseStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuccess: (path: string) => void;
}

export function FirstUseStorageModal({ isOpen, onClose, onSelectSuccess }: FirstUseStorageModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChooseFolder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await selectStorageFolder();
      if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
        const selected = res.filePaths[0];
        const saveRes = await setStoragePath(selected);
        if (saveRes.success && saveRes.storagePath) {
          onSelectSuccess(saveRes.storagePath);
          onClose();
        } else {
          setError(saveRes.error || "Failed to set storage location.");
        }
      }
    } catch (err: any) {
      console.error("Choose storage folder error:", err);
      setError(err.message || "Failed to select folder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Where should we save your Prompt Library?</h3>
              <p className="text-xs text-muted-foreground">Select a location on your PC to store your prompt files.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            Your prompts will be saved as clean Markdown files and automatically organized into category folders inside your chosen directory:
          </p>
          <div className="font-mono text-[11px] text-foreground bg-background p-2.5 rounded-lg border border-border">
            Selected Location\<br />
            ├── Coding\<br />
            ├── Marketing\<br />
            └── ...
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleChooseFolder}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Selecting...</span>
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4" />
                <span>Choose Folder</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
