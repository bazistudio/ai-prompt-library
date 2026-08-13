import * as React from "react";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, label, id, disabled }: SelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full max-w-[220px]">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-muted-foreground mb-1 text-left">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
