"use client";

import * as React from "react";
import { FolderHeart, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SidebarCategory() {
  const handleAddCategory = () => {
    alert("Category creation is prepared and will be connected to MongoDB in a future phase.");
  };

  return (
    <div className="flex flex-col gap-4 py-2 px-1">
      <div className="flex items-center justify-between px-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Prompt Categories
        </span>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-secondary/30 border border-dashed border-border gap-2">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <FolderHeart className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">No categories yet</span>
          <span className="text-[10px] text-muted-foreground">Create your first category</span>
        </div>
      </div>

      {/* Add Button */}
      <div className="px-3">
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs flex items-center justify-center gap-1.5"
          onClick={handleAddCategory}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </Button>
      </div>
    </div>
  );
}
