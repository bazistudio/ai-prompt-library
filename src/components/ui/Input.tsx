import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 transition-all focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
