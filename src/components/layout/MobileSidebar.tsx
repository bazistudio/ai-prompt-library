"use client";

import { X } from "lucide-react";
import { SidebarCategory } from "./SidebarCategory";
import { SidebarFooter } from "./SidebarFooter";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-card p-6 shadow-xl border-r border-border transition-transform animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold text-base text-foreground">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          <SidebarCategory />
        </div>

        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </div>
    </div>
  );
}
