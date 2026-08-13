import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2";
    
    const variants = {
      primary: "bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary",
      secondary: "bg-secondary hover:bg-muted text-secondary-foreground border border-border",
      ghost: "hover:bg-muted text-foreground",
      danger: "bg-danger hover:bg-danger/90 text-danger-foreground",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
