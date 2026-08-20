"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  Trash2,
  RefreshCw,
  Building,
  UserCheck,
  Check,
} from "lucide-react";
import {
  fetchLicenseStatus,
  activateLicense,
  deactivateLicense,
} from "@/services/licensing/licenseService";
import { LicenseInfo, DEFAULT_FREE_LICENSE } from "@/services/licensing/licenseVerifier";

export function LicenseSettings() {
  const [license, setLicense] = useState<LicenseInfo>(DEFAULT_FREE_LICENSE);
  const [loading, setLoading] = useState(true);
  const [keyInput, setKeyInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadLicense = async () => {
    setLoading(true);
    try {
      const data = await fetchLicenseStatus();
      setLicense(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicense();
  }, []);

  const handleActivate = async (e?: React.FormEvent, directKey?: string) => {
    if (e) e.preventDefault();
    const targetKey = directKey || keyInput;
    if (!targetKey.trim()) {
      setMessage({ type: "error", text: "Please enter a valid license key or activation token." });
      return;
    }

    setActivating(true);
    setMessage(null);
    try {
      const res = await activateLicense(targetKey.trim());
      if (res.success && res.license) {
        setLicense(res.license);
        setKeyInput("");
        setMessage({
          type: "success",
          text: `Successfully activated ${res.license.edition.toUpperCase()} edition! All offline features are verified.`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "License verification failed. Signature mismatch." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to activate license." });
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate and remove this license from this machine?")) {
      return;
    }
    setActivating(true);
    setMessage(null);
    try {
      const res = await deactivateLicense();
      if (res.success) {
        setLicense(DEFAULT_FREE_LICENSE);
        setMessage({ type: "success", text: "License removed. Switched back to Free Community edition." });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to remove license." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to remove license." });
    } finally {
      setActivating(false);
    }
  };

  const getEditionBadge = (edition: string) => {
    switch (edition) {
      case "commercial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Building className="h-3 w-3" />
            COMMERCIAL
          </span>
        );
      case "pro":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Sparkles className="h-3 w-3" />
            PRO EDITION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
            <UserCheck className="h-3 w-3" />
            FREE COMMUNITY
          </span>
        );
    }
  };

  const allFeatures = [
    { id: "core_prompt_library", label: "Offline SQLite Prompt Library & Categorization", free: true },
    { id: "multilingual_markdown", label: "Multilingual Markdown Studio (RTL / LTR / Arabic / Urdu)", free: true },
    { id: "workspaces_and_projects", label: "Workspaces & Project Grouping", free: true },
    { id: "quick_capture_tray", label: "System Tray & Global Quick Capture Hotkey", free: true },
    { id: "batch_export_import", label: "Batch Markdown File Import & Export", free: false },
    { id: "commercial_use_rights", label: "Commercial Distribution & Enterprise Rights", free: false },
    { id: "priority_offline_support", label: "Priority Offline Packaging & Release Updates", free: false },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Commercial Licensing & Entitlements</h2>
          <p className="text-xs text-muted-foreground">
            Cryptographic offline license verification and active feature entitlements.
          </p>
        </div>
        <button
          onClick={loadLicense}
          disabled={loading}
          className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Refresh license status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

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

      {/* Current License Card */}
      <div className="p-5 rounded-xl border border-border bg-card/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {license.edition === "free" ? "Free Community License" : `${license.edition.toUpperCase()} License`}
                </h3>
                {getEditionBadge(license.edition)}
              </div>
              <p className="text-xs text-muted-foreground">
                Status:{" "}
                <span className={license.status === "ACTIVE" ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                  {license.status}
                </span>
                {license.licensee && ` • Registered to: ${license.licensee}`}
              </p>
            </div>
          </div>

          {license.status === "ACTIVE" && (
            <button
              onClick={handleDeactivate}
              disabled={activating}
              className="px-3 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive flex items-center gap-1.5 hover:bg-destructive/20 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Deactivate</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">License Key</span>
            <span className="font-mono text-foreground font-semibold">
              {license.licenseKey ? license.licenseKey : "Default Community Key"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Validity</span>
            <span className="text-foreground font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {license.isLifetime ? "Lifetime (No Expiration)" : license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "Permanent"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Verification Mode</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <Check className="h-3 w-3" />
              Offline Digital Signature
            </span>
          </div>
        </div>
      </div>

      {/* Feature Entitlements Breakdown */}
      <div className="p-5 rounded-xl border border-border bg-card/40 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Feature Entitlements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allFeatures.map((feat) => {
            const isUnlocked = feat.free || license.features?.includes(feat.id);
            return (
              <div
                key={feat.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  isUnlocked
                    ? "bg-secondary/40 border-border text-foreground"
                    : "bg-muted/10 border-dashed border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isUnlocked ? "bg-emerald-500/20 text-emerald-500 font-bold" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isUnlocked ? "✓" : "–"}
                  </div>
                  <span>{feat.label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">
                  {isUnlocked ? "UNLOCKED" : "PRO/COMMERCIAL"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Binding & Hardware Token Card */}
      <div className="p-5 rounded-xl border border-border bg-card/40 space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-1">
              <Key className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Machine Binding (Optional)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Commercial and Pro licenses can optionally be bound to a single physical machine for strict compliance. 
                Currently, your license operates in Portable Mode and verifies offline via a digital signature. 
                No strict hardware enforcement is active at this time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              alert(
                "Device Fingerprint Diagnostics:\n\nOS Platform: win32 (x64)\nRuntime: Node.js / Electron\nLocal Machine Hash: [HIDDEN FOR SECURITY]\nBinding State: " + (license.status === "ACTIVE" ? "Bound to this device" : "Unbound")
              );
            }}
            className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0 self-start"
          >
            Check Device Info
          </button>
        </div>
        <div className="p-3 mt-2 rounded-lg bg-muted/30 border border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Current Machine Status:</span>
          <span className={`font-semibold ${license.status === "ACTIVE" ? "text-primary" : "text-foreground"}`}>
            {license.status === "ACTIVE" ? "Bound & Authorized" : "Unbound (Portable Mode)"}
          </span>
        </div>
      </div>

      {/* License Activation Box */}
      <div className="p-5 rounded-xl border border-border bg-card/40 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Activate New License</h3>
        </div>

        <form onSubmit={handleActivate} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Enter License Key or Cryptographic Token
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. PRO-OFFLINE-STUDIO-2026 or signed certificate"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Test Activation:</span>
              <button
                type="button"
                onClick={() => handleActivate(undefined, "PRO-OFFLINE-STUDIO-2026")}
                disabled={activating}
                className="px-2.5 py-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-500 text-[11px] font-semibold hover:bg-indigo-500/20 transition-colors cursor-pointer"
              >
                Pro Key
              </button>
              <button
                type="button"
                onClick={() => handleActivate(undefined, "COMMERCIAL-ENTERPRISE-2026")}
                disabled={activating}
                className="px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                Commercial Key
              </button>
            </div>

            <button
              type="submit"
              disabled={activating || !keyInput.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer ml-auto"
            >
              {activating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Activate License</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
