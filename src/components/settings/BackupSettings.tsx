"use client";

import { useState, useEffect } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { Toggle } from "./Toggle";
import { Select } from "./Select";
import {
  Archive,
  FolderOpen,
  FolderEdit,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  FileArchive,
  Loader2,
  X,
  ShieldAlert,
  Info,
} from "lucide-react";
import { getStoragePath, selectStorageFolder, openStorageFolder } from "@/services/storage/storageService";

interface BackupHistoryRecord {
  id: string;
  created_at: number;
  file_name: string;
  file_path: string;
  file_size: number;
  status: string;
  backup_type: string;
  error_message: string | null;
  checksum: string | null;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function BackupSettings() {
  const [backupPath, setBackupPath] = useState<string>("D:\\AI Prompt Backups");
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [retentionCount, setRetentionCount] = useState("7");
  const [lastBackupTime, setLastBackupTime] = useState("No backups yet");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const [backupHistory, setBackupHistory] = useState<BackupHistoryRecord[]>([]);

  // Restore Confirmation Modal State
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<BackupHistoryRecord | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.success && data.history) {
        setBackupHistory(data.history);
        const lastSuccess = data.history.find((h: BackupHistoryRecord) => h.status === "SUCCESS");
        if (lastSuccess) {
          const dt = new Date(lastSuccess.created_at);
          setLastBackupTime(`Today, ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        }
      }
    } catch (err) {
      console.error("Failed to load backup history:", err);
    }
  };

  useEffect(() => {
    // Fetch default storage path as fallback
    getStoragePath().then((path) => {
      if (path && !backupPath) {
        setBackupPath(`${path}\\Backups`);
      }
    });

    // Fetch persisted backup settings
    fetch("/api/backup/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setAutoBackupEnabled(data.settings.autoBackupEnabled);
          setFrequency(data.settings.frequency);
          setRetentionCount(data.settings.retentionCount);
          if (data.settings.backupPath) {
            setBackupPath(data.settings.backupPath);
          }
        }
      })
      .catch((err) => console.error("Failed to load backup settings:", err));

    fetchHistory();
  }, [backupPath]);

  // Sync settings when they change (excluding initial load)
  const saveSetting = async (key: string, value: any) => {
    try {
      await fetch("/api/backup/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
    }
  };

  const handleSelectLocation = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await selectStorageFolder();
      if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
        const newPath = res.filePaths[0];
        setBackupPath(newPath);
        saveSetting("backupPath", newPath);
        setMessage({ type: "success", text: `Backup folder updated to: ${newPath}` });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to select folder." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    const res = await openStorageFolder();
    if (!res.success) {
      setMessage({ type: "info", text: "Opened default local storage folder." });
    }
  };

  const handleBackupNow = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setMessage({
          type: "success",
          text: `Backup completed successfully. Saved to ${data.backup.file_name}`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Backup failed.",
        });
      }
      
      // Refresh history
      fetchHistory();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to initiate backup." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupToRestore) return;
    setRestoring(true);
    setMessage(null);

    // B2-A: Safely report that the actual Restore Engine is pending B2-D
    setTimeout(() => {
      setRestoring(false);
      setSelectedBackupToRestore(null);
      setMessage({
        type: "info",
        text: `ZIP Archive restore pipeline with integrity verification is scheduled for Phase B2-D.`,
      });
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Main Section */}
      <SettingsSection
        title="Backup & Restore"
        description="Protect your AI Prompt Library and move it safely between computers."
      >
        {message && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : message.type === "error"
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-primary/10 border-primary/20 text-primary"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : message.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <Info className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="glass-card p-6 rounded-2xl border border-border space-y-5 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Backup Location</h3>
                <span className="text-[10px] text-muted-foreground">
                  Offline Portable Archive Storage
                </span>
              </div>
            </div>
          </div>

          {/* Backup Location Path */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Configured Backup Folder:</label>
            <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-foreground break-all">
              {backupPath}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-border/40">
            <button
              onClick={handleSelectLocation}
              disabled={actionLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <FolderEdit className="h-4 w-4" />
              <span>Choose Location</span>
            </button>

            <button
              onClick={handleOpenFolder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Open Folder</span>
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* 2. Automatic Backup Configuration */}
      <SettingsSection
        title="Automatic Backup"
        description="Configure automated periodic snapshots of your entire prompt library."
      >
        <SettingRow
          title="Automatic Backup"
          description="Create recurring archive snapshots in the background."
        >
          <Toggle
            checked={autoBackupEnabled}
            onChange={(v) => {
              setAutoBackupEnabled(v);
              saveSetting("autoBackupEnabled", v);
            }}
            id="toggle-auto-backup"
          />
        </SettingRow>

        <SettingRow title="Frequency" description="How often automatic snapshots should be created.">
          <Select
            value={frequency}
            onChange={(v) => {
              setFrequency(v);
              saveSetting("frequency", v);
            }}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "manual", label: "Manual Only" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Keep backups" description="Number of recent archive copies to retain on disk.">
          <Select
            value={retentionCount}
            onChange={(v) => {
              setRetentionCount(v);
              saveSetting("retentionCount", v);
            }}
            options={[
              { value: "7", label: "7 Backups" },
              { value: "14", label: "14 Backups" },
              { value: "30", label: "30 Backups" },
            ]}
          />
        </SettingRow>

        <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>Last backup completed:</span>
          </div>
          <span className="font-semibold text-foreground">{lastBackupTime}</span>
        </div>

        {/* Immediate Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleBackupNow}
            disabled={actionLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>Backup Now</span>
          </button>

          <button
            onClick={() => {
              if (backupHistory.length > 0) {
                setSelectedBackupToRestore(backupHistory[0]);
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restore Backup</span>
          </button>
        </div>
      </SettingsSection>

      {/* 3. Backup History */}
      <SettingsSection
        title="Backup History"
        description="Previous archive snapshots stored on your computer."
      >
        <div className="space-y-3">
          {backupHistory.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-card/40 text-center space-y-2">
              <FileArchive className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">No previous backups recorded</p>
              <p className="text-[11px] text-muted-foreground">
                Click &quot;Backup Now&quot; to generate your first library snapshot.
              </p>
            </div>
          ) : (
            backupHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    item.status === "SUCCESS" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}>
                    {item.status === "SUCCESS" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <span>{item.file_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {formatBytes(item.file_size)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(item.created_at).toLocaleString()} • {item.backup_type}
                      {item.status === "FAILED" && item.error_message && (
                        <span className="text-destructive ml-2 font-medium">({item.error_message})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenFolder()}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-foreground transition-colors cursor-pointer"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setSelectedBackupToRestore(item)}
                    disabled={item.status !== "SUCCESS"}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SettingsSection>

      {/* 4. Restore Confirmation Modal */}
      {selectedBackupToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Restore Backup?</h3>
                  <p className="text-xs text-muted-foreground">
                    Your current library should be backed up before restoring another backup.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBackupToRestore(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Backup Archive:</span>
                <span className="font-mono font-bold text-foreground">{selectedBackupToRestore.file_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Created:</span>
                <span className="text-foreground">{new Date(selectedBackupToRestore.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Archive Size:</span>
                <span className="text-foreground">{formatBytes(selectedBackupToRestore.file_size)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                <span>{restoring ? "Restoring Library..." : "Restore Backup"}</span>
              </button>

              <button
                onClick={() => setSelectedBackupToRestore(null)}
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
