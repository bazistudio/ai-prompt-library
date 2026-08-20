"use client";

import { X, Keyboard, Command } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: "General & Navigation",
      shortcuts: [
        { keys: ["⌘ / Ctrl", "K"], description: "Open Command Palette & Global Search" },
        { keys: ["⌘ / Ctrl", "Shift", "N"], description: "Open Quick Capture Prompt dialog" },
        { keys: ["⌘ / Ctrl", "N"], description: "Create New Prompt" },
        { keys: ["?"], description: "Show Keyboard Shortcuts cheatsheet" },
        { keys: ["Esc"], description: "Close any modal or active dialog" },
      ],
    },
    {
      title: "Prompt Editor & Workspace",
      shortcuts: [
        { keys: ["⌘ / Ctrl", "S"], description: "Save draft prompt / version" },
        { keys: ["⌘ / Ctrl", "Shift", "C"], description: "Copy prompt to clipboard" },
        { keys: ["Tab"], description: "Indent list item or insert spacing in codeblock" },
      ],
    },
    {
      title: "Template Variables & Execution",
      shortcuts: [
        { keys: ["{{", "}}"], description: "Define template variable in prompt body" },
        { keys: ["{{var:default}}"], description: "Define template variable with fallback default value" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative text-left animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Keyboard Shortcuts</h2>
            <p className="text-xs text-muted-foreground">Productivity hotkeys for faster prompt engineering</p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat.title} className="space-y-2.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {cat.title}
              </h3>
              <div className="space-y-1.5 rounded-xl bg-muted/20 border border-border/40 p-2.5">
                {cat.shortcuts.map((sc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-xs text-foreground font-medium">{sc.description}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 text-[11px] font-mono font-semibold text-foreground bg-card border border-border rounded shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Command className="h-3.5 w-3.5 text-primary" />
            <span>Shortcuts adapt automatically to Windows, macOS, and Linux</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs hover:bg-secondary/80 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
