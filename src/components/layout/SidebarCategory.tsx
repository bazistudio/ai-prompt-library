"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Star,
  Folder,
  Plus,
  Edit2,
  FolderPlus,
} from "lucide-react";
import { CategoryItem, fetchCategories } from "@/services/categories/categoryService";
import { CategoryModal } from "@/components/categories/CategoryModal";

export function SidebarCategory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get("category") || "";
  const isFavorites = searchParams.get("favorite") === "true";

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreateModal = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleCategorySaved = (savedCat: CategoryItem) => {
    loadCategories();
    // If active category was renamed, update search param cleanly
    if (categoryToEdit && activeCategory === categoryToEdit.name) {
      router.push(`/prompts?category=${encodeURIComponent(savedCat.name)}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2 px-1 text-left">
      {/* 1. DASHBOARD */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Dashboard
        </span>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* 2. LIBRARY */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Library
        </span>
        <Link
          href="/prompts"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            pathname === "/prompts" && !isFavorites && !activeCategory
              ? "bg-primary text-primary-foreground font-bold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Library className="h-4 w-4" />
          <span>My Library</span>
        </Link>
        <Link
          href="/prompts?favorite=true"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            isFavorites
              ? "bg-accent/20 text-accent font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Star className="h-4 w-4 text-accent fill-accent/20" />
          <span>Favorites</span>
        </Link>
      </div>

      {/* 3. CATEGORIES */}
      <div className="space-y-2">
        {/* Header & Prominent New Category Button */}
        <div className="flex items-center justify-between px-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Categories
          </span>
        </div>

        {/* + New Category Button at Top of Sidebar */}
        <button
          onClick={handleOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>

        {/* Categories List */}
        <div className="space-y-0.5">
          {/* All Filter */}
          <Link
            href="/prompts"
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
              pathname === "/prompts" && !activeCategory && !isFavorites
                ? "bg-secondary text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>All Prompts</span>
            </div>
          </Link>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isCatActive = activeCategory === cat.name;
            const targetUrl = `/prompts?category=${encodeURIComponent(cat.name)}`;

            return (
              <div key={cat.id} className="group relative flex items-center">
                <Link
                  href={targetUrl}
                  className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isCatActive
                      ? "bg-secondary text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-6">
                    <Folder className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </div>
                </Link>

                {/* Edit Category Button */}
                <button
                  onClick={(e) => handleOpenEditModal(cat, e)}
                  title="Rename category"
                  className="absolute right-2 p-1 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-foreground hover:bg-background/80 rounded transition-all cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Modal for Create & Edit */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCategorySaved}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
}
