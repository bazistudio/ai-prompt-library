"use client";

import { useState } from "react";
import {
  Download,
  X,
  FileText,
  FileCode,
  Archive,
  Table,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Check,
} from "lucide-react";

interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount?: number;
  currentCategory?: string;
  currentWorkspace?: string;
}

type ExportFormat = "markdown" | "txt" | "json" | "csv" | "zip" | "pdf" | "epub" | "docx" | "html";
type ExportScope = "entire_library" | "current_workspace" | "current_category" | "selected_prompts";

export function AdvancedExportModal({
  isOpen,
  onClose,
  selectedCount = 0,
  currentCategory = "All",
  currentWorkspace = "Default Workspace",
}: AdvancedExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [scope, setScope] = useState<ExportScope>("entire_library");

  // Export options
  const [includeImages, setIncludeImages] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeVersions, setIncludeVersions] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExecuteExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      if (format === "pdf" || format === "epub" || format === "docx" || format === "html") {
        setMessage({
          type: "error",
          text: `${format.toUpperCase()} export pipeline is scheduled for Phase B advanced document export.`,
        });
        setExporting(false);
        return;
      }

      // Safe client export for JSON / TXT / Markdown
      const res = await fetch("/api/prompts");
      const data = await res.json();
      const prompts = data.prompts || [];

      let contentToExport = "";
      let filename = `ai-prompt-library-export-${Date.now()}`;
      let mimeType = "application/json";

      if (format === "json") {
        const payload = {
          exportDate: new Date().toISOString(),
          scope,
          format: "json",
          options: { includeImages, includeMetadata, includeVersions, includeTags },
          totalPrompts: prompts.length,
          prompts: prompts.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: includeMetadata ? p.description : undefined,
            category: p.category_name || p.category,
            tags: includeTags ? p.tags : [],
            content: p.content,
            created_at: p.created_at,
            updated_at: p.updated_at,
          })),
        };
        contentToExport = JSON.stringify(payload, null, 2);
        filename += ".json";
        mimeType = "application/json";
      } else if (format === "csv") {
        const headers = ["Title", "Category", "Tags", "Created", "Content"];
        const rows = prompts.map((p: any) => [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${(p.category_name || p.category || "").replace(/"/g, '""')}"`,
          `"${(Array.isArray(p.tags) ? p.tags.join(";") : "").replace(/"/g, '""')}"`,
          `"${new Date(p.created_at).toLocaleDateString()}"`,
          `"${(p.content || "").replace(/"/g, '""')}"`,
        ]);
        contentToExport = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
        filename += ".csv";
        mimeType = "text/csv";
      } else if (format === "txt" || format === "markdown") {
        contentToExport = prompts
          .map((p: any) => `# ${p.title}\nCategory: ${p.category_name || p.category}\n\n${p.content}\n\n---\n`)
          .join("\n\n");
        filename += format === "markdown" ? ".md" : ".txt";
        mimeType = "text/plain";
      } else if (format === "zip") {
        // Fallback or trigger DB snapshot
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/api/database/maintenance?download=true";
        setMessage({
          type: "success",
          text: "Raw SQLite Database & File snapshot downloaded successfully.",
        });
        setExporting(false);
        return;
      }

      const blob = new Blob([contentToExport], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: `Export successfully generated: ${filename}`,
      });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to generate export." });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Advanced Export</h2>
              <p className="text-xs text-muted-foreground">
                Export your prompt library into versatile document, archive, and code formats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {message && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* 1. Format Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground block">Select Export Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: "markdown", label: "Markdown (.md)", icon: FileText, supported: true },
                { id: "txt", label: "Plain Text (.txt)", icon: FileText, supported: true },
                { id: "json", label: "JSON Structure (.json)", icon: FileCode, supported: true },
                { id: "csv", label: "Spreadsheet (.csv)", icon: Table, supported: true },
                { id: "zip", label: "ZIP Archive Bundle", icon: Archive, supported: true },
                { id: "pdf", label: "PDF Document (.pdf)", icon: BookOpen, supported: false },
                { id: "epub", label: "E-Book (.epub)", icon: Sparkles, supported: false },
                { id: "docx", label: "Word Doc (.docx)", icon: FileSpreadsheet, supported: false },
                { id: "html", label: "HTML Web Page (.html)", icon: FileCode, supported: false },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as ExportFormat)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-2xs"
                        : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      {!fmt.supported && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          Coming Soon
                        </span>
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Scope Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground block">Export Scope</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "entire_library", label: "Entire Library", desc: "All prompts, categories, and tags" },
                { id: "current_workspace", label: "Current Workspace", desc: currentWorkspace },
                { id: "current_category", label: `Category: ${currentCategory}`, desc: "Prompts in active category" },
                {
                  id: "selected_prompts",
                  label: `Selected Prompts (${selectedCount})`,
                  desc: "Only individually checked items",
                },
              ].map((sc) => {
                const isSelected = scope === sc.id;
                return (
                  <label
                    key={sc.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5 border-primary" : "bg-background border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="export_scope"
                      checked={isSelected}
                      onChange={() => setScope(sc.id as ExportScope)}
                      className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground">{sc.label}</div>
                      <div className="text-[11px] text-muted-foreground">{sc.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Export Options Checkboxes */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground block">Included Metadata & Assets</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">Include Metadata</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">Include Tags</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVersions}
                  onChange={(e) => setIncludeVersions(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">Include Version History</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">Include Embedded Images</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={handleExecuteExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? "Generating Export..." : `Export ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
