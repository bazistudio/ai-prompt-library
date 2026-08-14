"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Star,
  Folder,
  Tag,
  Clock,
  BookOpen,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { fetchPrompts, toggleFavorite, PromptItem } from "@/services/prompts/promptService";

function PromptsLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";
  const isFavoriteOnly = searchParams.get("favorite") === "true";

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPrompts({
      category: activeCategory !== "All" ? activeCategory : undefined,
      favoriteOnly: isFavoriteOnly,
      search: searchQuery,
    })
      .then((data) => {
        if (isMounted) setPrompts(data);
      })
      .catch((err) => console.error("Error fetching prompts:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, isFavoriteOnly, searchQuery]);

  const handleToggleFavorite = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await toggleFavorite(promptId);
      setPrompts((prev) =>
        prev.map((p) => (p.id === promptId ? { ...p, is_favorite: res.is_favorite } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>{isFavoriteOnly ? "Favorite Prompts" : "My Prompt Library"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isFavoriteOnly
              ? "Your collection of starred prompt templates"
              : "Manage and organize your prompt engineering repository"}
          </p>
        </div>

        <Link
          href="/prompts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-md shadow-primary shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Prompt</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-3 rounded-xl border border-border flex flex-col md:flex-row items-center justify-between gap-3 bg-card">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, tags, or content..."
            className="block w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Categories Tabs & View Switch */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            Category: <strong className="text-foreground">{activeCategory}</strong>
          </span>

          <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading prompts from local database...</span>
        </div>
      ) : prompts.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-foreground">No prompts found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {searchQuery || activeCategory !== "All" || isFavoriteOnly
                ? "No prompts match your active search or category filters."
                : "Create your first prompt template to start building your offline library."}
            </p>
          </div>
          <Link
            href="/prompts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Prompt</span>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => router.push(`/prompts/${prompt.id}`)}
              className="glass-card p-5 rounded-2xl border border-border hover:border-primary/50 transition-all flex flex-col justify-between gap-4 cursor-pointer bg-card group relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border flex items-center gap-1">
                  <Folder className="h-3 w-3 text-primary" />
                  {prompt.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    v{prompt.current_version}
                  </span>
                  <button
                    onClick={(e) => handleToggleFavorite(e, prompt.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-accent transition-colors"
                    title={prompt.is_favorite ? "Unstar" : "Star"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        prompt.is_favorite
                          ? "text-accent fill-accent"
                          : "text-muted-foreground/40 group-hover:text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {prompt.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {prompt.description || prompt.current_content || "No description provided."}
                </p>
              </div>

              {/* Tags & Footer */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                    {prompt.tags.length > 3 && (
                      <span className="text-[9px] font-semibold text-muted-foreground/70">
                        +{prompt.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(prompt.updated_at)}
                  </span>
                  <span className="font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Prompt →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => router.push(`/prompts/${prompt.id}`)}
              className="glass-card p-4 rounded-xl border border-border hover:border-primary/50 transition-all flex items-center justify-between gap-4 cursor-pointer bg-card group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                  onClick={(e) => handleToggleFavorite(e, prompt.id)}
                  className="p-1 text-muted-foreground hover:text-accent"
                >
                  <Star
                    className={`h-4 w-4 ${
                      prompt.is_favorite ? "text-accent fill-accent" : "text-muted-foreground/40"
                    }`}
                  />
                </button>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {prompt.title}
                    </h3>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                      v{prompt.current_version}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {prompt.description || prompt.current_content}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border hidden sm:inline">
                  {prompt.category}
                </span>
                <span className="text-[10px] text-muted-foreground hidden md:inline">
                  {formatDate(prompt.updated_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PromptsLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <PromptsLibraryContent />
    </Suspense>
  );
}
