import Link from "next/link";
import { Terminal, Database, Cpu, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary">
            <Terminal className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">
            AI Prompt Library
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground transition-colors shadow-md shadow-primary"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground text-xs font-semibold mb-6">
          <Sparkles className="h-3 w-3 text-accent" />
          Boilerplate Phase 1 Live
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
          Your Personal{" "}
          <span className="brand-text-gradient">
            Prompt Engineering
          </span>{" "}
          Workspace
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Create, test, search, version, and organize prompts in a secure environment. Built on Next.js 16 with a cloud-ready MongoDB database and native-isolated SQLite connection.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 justify-center w-full max-w-md">
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-all shadow-lg shadow-primary group"
          >
            Enter Dashboard
            <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/register"
            className="flex-1 flex items-center justify-center px-6 py-3.5 rounded-xl glass-card text-muted-foreground hover:text-foreground hover:bg-muted font-semibold transition-all"
          >
            Create Account
          </Link>
        </div>

        <div className="w-full">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-foreground">
            Hybrid Storage Architecture
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {/* MongoDB Card */}
            <div className="glass-card-glow p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-primary/10 transition-all duration-500" />
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center text-success">
                  <Database className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-success/10 text-success border border-success/20">
                  Online Storage
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">MongoDB</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Primary development and online storage. Store and verify your users, prompts, tags, categories, version histories, and workspace metrics securely in the cloud.
              </p>
            </div>

            {/* SQLite Card */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-info/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-info/10 transition-all duration-500" />
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-info/15 border border-info/30 flex items-center justify-center text-info">
                  <Cpu className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-info/10 text-info border border-info/20">
                  Local Storage
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">SQLite</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prepared for the future Electron desktop application. Designed to easily transition the prompt library database directly onto the user&apos;s local file system when bundled with Electron.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-muted-foreground border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>AI Prompt Library Boilerplate</span>
          </div>
          <p className="text-muted-foreground">© 2026 AI Prompt Library. All secrets secured server-side.</p>
        </div>
      </footer>
    </div>
  );
}
