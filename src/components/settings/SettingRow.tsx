import * as React from "react";

interface SettingRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border last:border-b-0">
      <div className="flex flex-col max-w-xl text-left">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {description && (
          <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</span>
        )}
      </div>
      <div className="flex items-center shrink-0 self-start sm:self-auto">
        {children}
      </div>
    </div>
  );
}
