"use client";

import { Sparkles } from "lucide-react";

interface ComingSoonSettingsProps {
  title: string;
}

export function ComingSoonSettings({ title }: ComingSoonSettingsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-secondary/15 border border-dashed border-border gap-4 min-h-[300px]">
      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground animate-pulse">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-2 max-w-sm">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <span className="text-xs font-semibold text-accent uppercase tracking-widest">
          Coming Soon
        </span>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This preference section is prepared and will be fully implemented and connected to database storage in subsequent phases.
        </p>
      </div>
    </div>
  );
}
