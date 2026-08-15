"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Lock, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && Boolean(window.electronAPI)) {
      setIsElectron(true);
    }
  }, []);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isElectron && window.electronAPI?.security) {
        await window.electronAPI.security.toggleLock(true);
        window.location.reload();
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

  return (
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
  );
}
