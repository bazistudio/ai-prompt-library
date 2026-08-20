export interface PromptVersion {
  id: string;
  version_number: number;
  content: string;
  change_summary?: string;
  created_at: number;
}

export interface PromptItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  category_id?: string;
  project_id?: string;
  project_name?: string;
  project_color?: string;
  is_favorite: boolean;
  is_archived: boolean;
  current_version: number;
  created_at: number;
  updated_at: number;
  current_content?: string;
  tags: string[];
  text_direction?: "ltr" | "rtl" | "auto";
  language?: string;
  versions?: PromptVersion[];
}

export interface CreatePromptInput {
  title: string;
  description?: string;
  category?: string;
  categoryId?: string;
  projectId?: string;
  tags?: string[];
  content: string;
  textDirection?: "ltr" | "rtl" | "auto";
  language?: string;
}

export interface AddVersionInput {
  promptId: string;
  content: string;
  changeSummary?: string;
}

export interface UpdateMetaInput {
  promptId: string;
  title?: string;
  description?: string;
  category?: string;
  categoryId?: string;
  projectId?: string;
  tags?: string[];
  textDirection?: "ltr" | "rtl" | "auto";
  language?: string;
}

export interface GetPromptsOptions {
  category?: string;
  categoryId?: string;
  projectId?: string;
  search?: string;
  favoriteOnly?: boolean;
}

function isElectron(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).electron?.prompts);
}

export async function fetchPrompts(options: GetPromptsOptions = {}): Promise<PromptItem[]> {
  if (isElectron()) {
    return (window as any).electron.prompts.getAll(options);
  }
  const params = new URLSearchParams();
  if (options.projectId) params.set("projectId", options.projectId);
  if (options.categoryId) params.set("categoryId", options.categoryId);
  if (options.category) params.set("category", options.category);
  if (options.search) params.set("search", options.search);
  if (options.favoriteOnly) params.set("favoriteOnly", "true");

  const res = await fetch(`/api/desktop-prompts?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch prompts");
  return data.prompts;
}

export async function fetchPromptById(id: string): Promise<PromptItem> {
  if (isElectron()) {
    return (window as any).electron.prompts.getById(id);
  }
  const res = await fetch(`/api/desktop-prompts/${id}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Prompt not found");
  return data.prompt;
}

export async function createPrompt(input: CreatePromptInput): Promise<{ success: boolean; promptId: string; error?: string }> {
  if (isElectron()) {
    return (window as any).electron.prompts.create(input);
  }
  const res = await fetch("/api/desktop-prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to create prompt");
  return data;
}

export async function addPromptVersion(input: AddVersionInput): Promise<{ success: boolean; versionNumber: number }> {
  if (isElectron()) {
    return (window as any).electron.prompts.addVersion(input);
  }
  const res = await fetch(`/api/desktop-prompts/${input.promptId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addVersion", ...input }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to save version");
  return data;
}

export async function updatePromptMeta(input: UpdateMetaInput): Promise<{ success: boolean }> {
  if (isElectron()) {
    return (window as any).electron.prompts.updateMeta(input);
  }
  const res = await fetch(`/api/desktop-prompts/${input.promptId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateMeta", ...input }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to update prompt metadata");
  return data;
}

export async function toggleFavorite(id: string): Promise<{ success: boolean; is_favorite: boolean }> {
  if (isElectron()) {
    return (window as any).electron.prompts.toggleFavorite(id);
  }
  const res = await fetch(`/api/desktop-prompts/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "toggleFavorite" }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to toggle favorite");
  return data;
}

export async function fetchPromptStats(): Promise<{
  totalPrompts: number;
  favoritePrompts: number;
  totalCategories: number;
  totalVersions: number;
  recentPrompts: Array<{
    id: string;
    title: string;
    description?: string;
    category: string;
    current_version: number;
    is_favorite: boolean;
    updated_at: number;
  }>;
}> {
  if (isElectron()) {
    return (window as any).electron.prompts.getStats();
  }
  const res = await fetch("/api/desktop-prompts?stats=true");
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch prompt stats");
  return data.stats;
}

export async function deletePrompt(id: string): Promise<{ success: boolean }> {
  if (isElectron()) {
    return (window as any).electron.prompts.delete(id);
  }
  const res = await fetch(`/api/desktop-prompts/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete prompt");
  return data;
}
