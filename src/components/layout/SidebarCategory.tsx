"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Star,
  PlusCircle,
  Folder,
  Settings,
  Terminal,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Coding",
  "Marketing",
  "Writing",
  "Business",
  "YouTube",
  "AI",
  "Productivity",
  "Other",
];

export function SidebarCategory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const isFavorites = searchParams.get("favorite") === "true";

  return (
    <div className="flex flex-col gap-6 py-2 px-1 text-left">
      {/* 1. DASHBOARD */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Dashboard
        </span>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* 2. LIBRARY */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Library
        </span>
        <Link
          href="/prompts"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            pathname === "/prompts" && !isFavorites && !activeCategory
              ? "bg-primary text-primary-foreground font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Library className="h-4 w-4" />
          <span>My Library</span>
        </Link>
        <Link
          href="/prompts?favorite=true"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            isFavorites
              ? "bg-accent/20 text-accent font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Star className="h-4 w-4 text-accent fill-accent/20" />
          <span>Favorites</span>
        </Link>
      </div>

      {/* 3. CREATE */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Create
        </span>
        <Link
          href="/prompts/new"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            pathname === "/prompts/new"
              ? "bg-primary text-primary-foreground font-bold shadow-sm"
              : "text-primary hover:bg-primary/10 bg-primary/5 border border-primary/20"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Prompt</span>
        </Link>
      </div>

      {/* 4. ORGANIZE */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Categories
          </span>
        </div>

        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => {
            const isCatActive =
              cat === "All"
                ? pathname === "/prompts" && !activeCategory && !isFavorites
                : activeCategory === cat;

            const targetUrl = cat === "All" ? "/prompts" : `/prompts?category=${encodeURIComponent(cat)}`;

            return (
              <Link
                key={cat}
                href={targetUrl}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isCatActive
                    ? "bg-secondary text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{cat}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. SYSTEM */}
      <div className="space-y-1 pt-2 border-t border-border/50">
        <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          System
        </span>
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            pathname === "/settings"
              ? "bg-secondary text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
