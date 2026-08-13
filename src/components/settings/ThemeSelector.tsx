"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="flex gap-2 w-full max-w-md">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex-grow flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
