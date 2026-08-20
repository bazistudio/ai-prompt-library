"use client";

import { Shield, KeyRound, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/admin/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm glass-card p-8 rounded-2xl border border-border space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-xs text-muted-foreground">Sign in to manage the application</p>
        </div>

        <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-warning text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>UI Mock Mode: Any credentials will work.</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Admin Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            Return to App
          </Link>
        </div>
      </div>
    </div>
  );
}
