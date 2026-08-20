"use client";

import Link from "next/link";
import { Terminal, Home, Search, Sun, Moon, UserCircle, Menu, PlusCircle, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { LogoutButton } from "@/components/ui/LogoutButton";

interface NavbarProps {
  onMenuToggle: () => void;
  onQuickCapture?: () => void;
  onOpenCommandPalette?: () => void;
  username: string;
  email: string;
}

export function Navbar({ onMenuToggle, onQuickCapture, onOpenCommandPalette, username, email }: NavbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="glass-card sticky top-0 z-40 px-4 md:px-6 py-3 flex items-center justify-between h-[65px] w-full">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand Logo & Title */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary">
            <Terminal className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm md:text-base tracking-tight text-foreground hidden sm:inline">
            AI Prompt Library
          </span>
        </Link>

        {/* Vertical Separator */}
        <div className="h-4 w-[1px] bg-border hidden sm:block mx-2" />

        {/* Navigation Link */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prompt Home</span>
        </Link>
      </div>

      {/* Center Search (Interactive Command Palette Trigger) */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs group"
          title="Search prompts or jump to actions (⌘K)"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs">Search prompts & actions...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={onQuickCapture}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition-colors shadow-2xs cursor-pointer"
          title="Quick Capture Prompt (Ctrl+Shift+N)"
        >
          <Zap className="h-3.5 w-3.5 fill-amber-500/30" />
          <span className="hidden sm:inline">Quick Capture</span>
        </button>

        {/* New Prompt Button */}
        <Link
          href="/prompts/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">New Prompt</span>
        </Link>
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
          title="Search prompts & actions"
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? (
            <Sun className="h-4.5 w-4.5 text-accent" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-primary" />
          )}
        </button>

        {/* Profile indicator */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <UserCircle className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none">{username}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">{email}</span>
          </div>
        </div>

        {/* Logout */}
        <LogoutButton />
      </div>
    </header>
  );
}
