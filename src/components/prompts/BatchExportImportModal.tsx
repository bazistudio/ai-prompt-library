"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Upload,
  FileJson,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { fetchLicenseStatus } from "@/services/licensing/licenseService";
import { hasEntitlement, LicenseInfo } from "@/services/licensing/licenseVerifier";
import { ProjectItem } from "@/services/projects/projectService";

interface BatchExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  onImportComplete?: () => void;
}

export function BatchExportImportTrigger({
  projects = [],
  className = "",
  onImportComplete,
}: {
  projects?: ProjectItem[];
  className?: string;
  onImportComplete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedProjects, setLoadedProjects] = useState<ProjectItem[]>(projects);

  useEffect(() => {
    if (projects.length === 0) {
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setLoadedProjects(data);
          else if (data.projects) setLoadedProjects(data.projects);
        })
        .catch(() => {});
    }
  }, []); // Removed 'projects' to fix infinite loop

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-muted transition-all shadow-xs ${className}`}
      >
        <Download className="h-3.5 w-3.5 text-primary" />
        <span>Backup & Import</span>
      </button>

      <BatchExportImportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projects={loadedProjects}
        onImportComplete={() => {
          if (onImportComplete) onImportComplete();
          setIsOpen(false);
        }}
      />
    </>
  );
}

export function BatchExportImportModal({
  isOpen,
  onClose,
  projects,
  onImportComplete,
}: BatchExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loadingLicense, setLoadingLicense] = useState(true);

  // Export State
  const [exportProjectId, setExportProjectId] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Import State
  const [importProjectId, setImportProjectId] = useState<string>("proj_default");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount?: number;
    renamedCount?: number;
    error?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingLicense(true);
      setExportSuccess(null);
      setImportResult(null);
      setImportFile(null);

      fetchLicenseStatus()
        .then((info) => setLicense(info))
        .catch((err) => console.error("Failed to check license:", err))
        .finally(() => setLoadingLicense(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isEntitled = hasEntitlement(license, "batch_export_import");

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportSuccess(null);

      const url = exportProjectId === "all"
        ? "/api/prompts/batch"
        : `/api/prompts/batch?projectId=${encodeURIComponent(exportProjectId)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to export library.");

      const data = await res.json();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().split("T")[0];
      const projLabel = exportProjectId === "all" ? "full_library" : exportProjectId;
      a.download = `ai_prompts_backup_${projLabel}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setExportSuccess(`Successfully exported ${data.count} prompt(s).`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to export prompts.");
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setImporting(true);
      setImportResult(null);

      const text = await importFile.text();
      let parsed: any;

      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file format. Please upload a valid JSON export.");
      }

      const res = await fetch("/api/prompts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompts: Array.isArray(parsed) ? parsed : parsed.prompts,
          targetProjectId: importProjectId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to import prompts.");
      }

      setImportResult(result);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      console.error(err);
      setImportResult({ success: false, error: err.message || "Import failed." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Batch Export & Import
              </h2>
              <p className="text-xs text-muted-foreground">
                Backup, migrate, or bulk load prompt templates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-border flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "export"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Batch Export</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Batch Import</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loadingLicense ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Verifying license entitlements...</span>
            </div>
          ) : !isEntitled ? (
            /* Entitlement Required Warning */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Pro / Commercial Entitlement Required</span>
                </div>
                <p className="leading-relaxed">
                  Bulk library JSON/Markdown export and multi-workspace import are available on the <strong>Pro Studio</strong> and <strong>Commercial</strong> editions.
                </p>
                <p className="text-[11px] opacity-80">
                  Single-prompt Markdown export, copy, and template variable execution remain completely free.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Close
                </button>

                <Link
                  href="/settings"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Activate License in Settings</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : activeTab === "export" ? (
            /* Export Form */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Select Workspace to Export
                </label>
                <select
                  value={exportProjectId}
                  onChange={(e) => setExportProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-card text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">Entire Library (All Workspaces)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <FileJson className="h-4 w-4 text-primary" />
                  <span>Comprehensive JSON Backup Archive</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Includes full prompt markdown text, all historical version records, tags, text directions, and category mappings.
                </p>
              </div>

              {exportSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{exportSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating Archive...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Export JSON Backup</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Import Form */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Destination Workspace
                </label>
                <select
                  value={importProjectId}
                  onChange={(e) => setImportProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-card text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl bg-muted/10 hover:bg-muted/20 cursor-pointer transition-all text-center space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <Upload className="h-6 w-6 text-primary mx-auto opacity-80" />
                <div className="text-xs font-medium text-foreground">
                  {importFile ? importFile.name : "Click to select a JSON prompt archive"}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {importFile
                    ? `${(importFile.size / 1024).toFixed(1)} KB`
                    : "Supports JSON exports generated by AI Prompt Library"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Zero-Overwrite Protection Guarantee</span>
                </div>
                <p>
                  Importing will never overwrite existing prompts. If duplicate titles are detected, a date suffix is automatically appended to protect existing work.
                </p>
              </div>

              {importResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    importResult.success
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {importResult.success ? (
                    <>
                      <div className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Import Successful</span>
                      </div>
                      <p>
                        Imported {importResult.importedCount} prompt(s) successfully.
                        {importResult.renamedCount && importResult.renamedCount > 0
                          ? ` (${importResult.renamedCount} duplicate titles safely renamed)`
                          : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4" />
                        <span>Import Error</span>
                      </div>
                      <p>{importResult.error || "An error occurred during import."}</p>
                    </>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import Prompts</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
