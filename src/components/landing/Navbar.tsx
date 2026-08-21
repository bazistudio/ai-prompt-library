"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, Menu, X, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { landingConfig } from "@/config/landingConfig";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function LandingNavbar() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/60 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden p-1 shadow-sm group-hover:border-primary/40 transition-all">
            <Image
              src="/images/logo.png"
              alt="Bazi Studio AI Prompt Library Logo"
              width={28}
              height={28}
              className="object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
              {landingConfig.productName}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase -mt-0.5">
              by {landingConfig.brandName}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#showcase" className="hover:text-foreground transition-colors">
            Showcase
          </a>
          <a href="#privacy" className="hover:text-foreground transition-colors">
            Offline Privacy
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
          <a
            href={landingConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggler using existing ThemeProvider */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl border border-border/60 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-accent" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </button>

          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer"
          >
            Open Dashboard
          </Link>

          <a
            href="#pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <span>Get AI Prompt Library</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-primary" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-md px-6 py-4 space-y-3 text-left animate-in slide-in-from-top-2 duration-200">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            Features
          </a>
          <a
            href="#showcase"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            Showcase
          </a>
          <a
            href="#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            Offline Privacy
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            Pricing
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            FAQ
          </a>
          <a
            href={landingConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            <GithubIcon className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background text-foreground"
            >
              Open Dashboard
            </Link>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md"
            >
              Get AI Prompt Library
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
