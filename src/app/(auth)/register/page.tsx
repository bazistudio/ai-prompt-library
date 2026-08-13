"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Terminal, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { registerSchema } from "@/lib/validation/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const clientValidation = registerSchema.safeParse({ username, email, password });
    if (!clientValidation.success) {
      setFieldErrors(clientValidation.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(data.message || "Something went wrong during registration.");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary mb-4">
            <Terminal className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start organizing your AI prompt library today
          </p>
        </div>

        <div className="glass-card-glow p-8 rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg glass-card border border-border text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all bg-card"
                  placeholder="johndoe"
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.username[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg glass-card border border-border text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all bg-card"
                  placeholder="name@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg glass-card border border-border text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all bg-card"
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer shadow-md shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground hover:text-primary-hover transition-colors underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
