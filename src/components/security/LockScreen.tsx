"use client";

import { useEffect, useState } from "react";
import { Lock, KeyRound, ShieldAlert, ArrowRight, RefreshCw } from "lucide-react";

import { SecurityStatusData } from "@/types/electron";

export function LockScreen() {
  const [status, setStatus] = useState<SecurityStatusData | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const fetchStatus = async () => {
    if (typeof window !== "undefined" && window.electronAPI?.security) {
      try {
        const res = await window.electronAPI.security.getStatus();
        setStatus(res);
        if (res.lockoutRemainingSeconds > 0) {
          setCooldown(res.lockoutRemainingSeconds);
        }
      } catch (err) {
        console.error("Failed to get security status:", err);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!status || !status.enabled || !status.isLocked) {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || cooldown > 0 || loading) return;

    setLoading(true);
    setError(null);

    try {
      if (window.electronAPI?.security) {
        const res = await window.electronAPI.security.unlock(input);
        if (res.success) {
          setInput("");
          await fetchStatus();
        } else {
          setError(res.error || "Unlock failed.");
          if (res.lockoutRemaining && res.lockoutRemaining > 0) {
            setCooldown(res.lockoutRemaining);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Unlock attempt error.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!recoveryKeyInput.trim()) {
      setRecoveryError("Please enter your Recovery Key.");
      return;
    }
    if (newPasswordInput.length < 6) {
      setRecoveryError("New password must be at least 6 characters.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setRecoveryError("Passwords do not match.");
      return;
    }

    setRecoveryLoading(true);

    try {
      if (window.electronAPI?.security) {
        const res = await window.electronAPI.security.recoverAccess(
          recoveryKeyInput,
          newPasswordInput,
          "key"
        );
        if (res.success) {
          setShowRecoveryModal(false);
          setRecoveryKeyInput("");
          setNewPasswordInput("");
          setConfirmPasswordInput("");
          await fetchStatus();
        } else {
          setRecoveryError(res.error || "Recovery failed. Access denied.");
        }
      }
    } catch (err: any) {
      setRecoveryError(err?.message || "Failed to process recovery key.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-primary/20 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-inner">
          <Lock className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
          AI Prompt Library
        </h1>
        <p className="text-xs text-muted-foreground mb-6">
          Application Locked — Enter your credentials to continue
        </p>

        {cooldown > 0 ? (
          <div className="w-full bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6 flex items-center justify-center gap-2 text-danger text-xs font-semibold animate-pulse">
            <ShieldAlert className="h-4 w-4" />
            <span>Too many attempts. Locked out for {cooldown}s.</span>
          </div>
        ) : null}

        {error && (
          <div className="w-full bg-danger/10 border border-danger/30 text-danger rounded-xl p-3 text-xs mb-4 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} className="w-full space-y-4">
          <div className="text-left space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>{status.method === "pin" ? "6-Digit PIN" : "Account Password"}</span>
            </label>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={status.method === "pin" ? "••••••" : "••••••••••••"}
              maxLength={status.method === "pin" ? 6 : 100}
              disabled={cooldown > 0 || loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-center tracking-widest font-mono"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={cooldown > 0 || loading || !input.trim()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Unlock Application</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => setShowRecoveryModal(true)}
          className="mt-6 text-xs text-muted-foreground hover:text-primary transition-colors underline cursor-pointer"
        >
          Forgot Password or PIN?
        </button>
      </div>

      {/* Recovery Access Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-border shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center text-warning">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Recover Application Access</h3>
                <p className="text-xs text-muted-foreground">
                  Enter your 24-character Recovery Key to reset your password.
                </p>
              </div>
            </div>

            {recoveryError && (
              <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl p-3 text-xs">
                {recoveryError}
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Recovery Key
                </label>
                <input
                  type="text"
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
                  placeholder="AB7K-X92P-M4Q8-T6ZW-3RKC-N5YD"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-mono tracking-wider uppercase text-center"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {recoveryLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Set New Password & Unlock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
