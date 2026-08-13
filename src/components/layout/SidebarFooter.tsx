"use client";

import Link from "next/link";
import { Settings, HelpCircle } from "lucide-react";

export function SidebarFooter() {
  const handlePlaceholder = (feature: string) => {
    alert(`${feature} will be implemented in a subsequent phase.`);
  };

  return (
    <div className="flex flex-col gap-1 border-t border-border pt-4 px-1 mt-auto">
      <Link
        href="/settings"
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left w-full cursor-pointer font-medium"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Link>
      <button
        onClick={() => handlePlaceholder("Documentation")}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left w-full cursor-pointer font-medium"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Docs</span>
      </button>
    </div>
  );
}
