"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  FolderTree,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Keyboard,
  HardDrive,
  FileText,
  Zap,
  ArrowRight,
  X,
  Layers,
  Workflow,
  Swords,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface CommandPromptItem {
  id: string;
  title: string;
  description?: string | null;
  category_name?: string | null;
  category?: string | null;
  tags?: string[];
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture?: () => void;
  onOpenShortcuts?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "prompts" | "actions" | "navigation";
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  action: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onOpenQuickCapture,
  onOpenShortcuts,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [prompts, setPrompts] = useState<CommandPromptItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch prompts when opened
  useEffect(() => {
    if (!isOpen) return;

    setQuery("");
    setSelectedIndex(0);
    setLoading(true);

    fetch("/api/prompts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.prompts)) {
          setPrompts(data.prompts);
        }
      })
      .catch((err) => console.error("Failed to load prompts for command palette:", err))
      .finally(() => setLoading(false));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [isOpen]);

  // Construct items
  const items: CommandItem[] = useMemo(() => {
    const staticActions: CommandItem[] = [
      {
        id: "action-new-prompt",
        title: "Create New Prompt",
        subtitle: "Open the prompt editor to craft a new prompt",
        category: "actions",
        icon: PlusCircle,
        badge: "Cmd+N",
        action: () => {
          router.push("/prompts/new");
          onClose();
        },
      },
      {
        id: "action-quick-capture",
        title: "Quick Capture Prompt",
        subtitle: "Rapidly draft and save a prompt from anywhere",
        category: "actions",
        icon: Zap,
        badge: "Cmd+Shift+N",
        action: () => {
          onClose();
          onOpenQuickCapture?.();
        },
      },
      {
        id: "nav-dashboard",
        title: "Go to Dashboard",
        subtitle: "Overview of your recent activity and statistics",
        category: "navigation",
        icon: Layers,
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-workflows",
        title: "Prompt Workflows & Chains",
        subtitle: "Build and execute multi-step AI prompt pipelines",
        category: "navigation",
        icon: Workflow,
        action: () => {
          router.push("/workflows");
          onClose();
        },
      },
      {
        id: "nav-arena",
        title: "Model Comparison Arena",
        subtitle: "Benchmark and test models side-by-side in real-time",
        category: "navigation",
        icon: Swords,
        action: () => {
          router.push("/arena");
          onClose();
        },
      },
      {
        id: "nav-categories",
        title: "Manage Categories & Workspaces",
        subtitle: "Organize prompts into hierarchical folders",
        category: "navigation",
        icon: FolderTree,
        action: () => {
          router.push("/categories");
          onClose();
        },
      },
      {
        id: "nav-analytics",
        title: "Library Analytics",
        subtitle: "View category distributions and 14-day velocity",
        category: "navigation",
        icon: BarChart3,
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-settings-storage",
        title: "Storage & Database Maintenance",
        subtitle: "Manage SQLite backups, vacuum, and file locations",
        category: "navigation",
        icon: HardDrive,
        action: () => {
          router.push("/settings?tab=storage");
          onClose();
        },
      },
      {
        id: "nav-settings",
        title: "Application Settings",
        subtitle: "Customize themes, fonts, accounts, and licensing",
        category: "navigation",
        icon: Settings,
        action: () => {
          router.push("/settings");
          onClose();
        },
      },
      {
        id: "action-toggle-theme",
        title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
        subtitle: "Toggle workspace color theme",
        category: "actions",
        icon: theme === "dark" ? Sun : Moon,
        action: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          onClose();
        },
      },
      {
        id: "action-shortcuts",
        title: "Keyboard Shortcuts Cheatsheet",
        subtitle: "View full list of productivity hotkeys",
        category: "actions",
        icon: Keyboard,
        badge: "?",
        action: () => {
          onClose();
          onOpenShortcuts?.();
        },
      },
    ];

    const promptItems: CommandItem[] = prompts.map((p) => ({
      id: `prompt-${p.id}`,
      title: p.title,
      subtitle: p.description || p.category_name || "Uncategorized",
      category: "prompts",
      icon: FileText,
      badge: p.tags?.length ? `#${p.tags[0]}` : undefined,
      action: () => {
        router.push(`/prompts/${p.id}`);
        onClose();
      },
    }));

    const all = [...staticActions, ...promptItems];

    if (!query.trim()) {
      return all;
    }

    const q = query.toLowerCase().trim();
    return all.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      return matchTitle || matchSubtitle;
    });
  }, [query, prompts, theme, router, onClose, onOpenQuickCapture, onOpenShortcuts, setTheme]);

  // Adjust selection bounds when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, items.length - 1)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-muted/20">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search prompts, or jump to..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-border/20">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading workspace index...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <p className="text-xs font-semibold text-foreground">No matching commands or prompts</p>
              <p className="text-[11px] text-muted-foreground">
                Try searching with different keywords or create a new prompt.
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{item.title}</div>
                      {item.subtitle && (
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                          isSelected
                            ? "bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                            : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight
                      className={`h-3.5 w-3.5 ${
                        isSelected ? "text-primary-foreground opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↑</kbd>{" "}
              <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↵</kbd> to
              select
            </span>
          </div>
          <div>{items.length} options available</div>
        </div>
      </div>
    </div>
  );
}
