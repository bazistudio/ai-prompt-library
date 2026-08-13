"use client";

import Link from "next/link";
import { Terminal, Home, Search, Sun, Moon, UserCircle, Menu } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { LogoutButton } from "@/components/ui/LogoutButton";

interface NavbarProps {
  onMenuToggle: () => void;
  username: string;
  email: string;
}

export function Navbar({ onMenuToggle, username, email }: NavbarProps) {
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

      {/* Center Search (UI Placeholder) */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search prompts..."
            disabled
            className="block w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card/50 text-foreground placeholder-muted-foreground/40 text-xs focus:outline-none cursor-not-allowed opacity-75"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Search Icon Placeholder (visible only on mobile) */}
        <button
          onClick={() => alert("Search is placeholder only in the boilerplate phase.")}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
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
