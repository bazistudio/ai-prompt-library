"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Lock, Loader2, ShieldAlert, ArrowRight, X } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [showNoCredentialModal, setShowNoCredentialModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && Boolean(window.electronAPI)) {
      setIsElectron(true);
    }
  }, []);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isElectron && window.electronAPI?.security) {
        const status = await window.electronAPI.security.getStatus();

        // Guard: If user has not set any lock credential (neither password nor PIN)
        if (!status.hasCredential) {
          setShowNoCredentialModal(true);
          return;
        }

        // Credential exists -> Lock application instantly!
        const res = await window.electronAPI.security.lockApp();
        if (res.success) {
          window.dispatchEvent(new CustomEvent("app:lock-state-changed"));
        } else if (res.error) {
          alert(res.error);
        }
      } else {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        });
        if (response.ok) {
          router.push("/login");
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    setShowNoCredentialModal(false);
    router.push("/settings");
  };

  return (
    <>
      <button
        onClick={handleAction}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-xs font-semibold disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isElectron ? (
          <Lock className="h-3.5 w-3.5 text-primary" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        {isElectron ? "Lock App" : "Logout"}
      </button>

      {/* Set Lock Code First Modal */}
      {showNoCredentialModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-primary/20 shadow-2xl space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center text-warning shadow-sm">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Set Lock Code First</h3>
                  <p className="text-xs text-muted-foreground">Security credentials required</p>
                </div>
              </div>
              <button
                onClick={() => setShowNoCredentialModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              You must set up a <strong className="text-foreground">6-digit PIN</strong> or <strong className="text-foreground">Application Password</strong> in Settings before you can lock the application.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowNoCredentialModal(false)}
                className="px-3.5 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleGoToSettings}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>Go to Settings</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
