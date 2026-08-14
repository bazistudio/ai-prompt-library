export interface CategoryItem {
  id: string;
  name: string;
  folder_name: string;
  sort_order: number;
  is_default: boolean;
  created_at: number;
  updated_at: number;
}

function getElectronCategoryAPI() {
  if (typeof window === "undefined") return null;
  return (window as any).electronAPI?.categories || (window as any).electron?.categories || null;
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const electronCat = getElectronCategoryAPI();
  if (electronCat && typeof electronCat.getAll === "function") {
    return electronCat.getAll();
  }

  const res = await fetch("/api/categories");
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch categories");
  }
  return data.categories;
}

export async function createCategory(name: string): Promise<{ success: boolean; category?: CategoryItem; error?: string }> {
  const electronCat = getElectronCategoryAPI();
  if (electronCat && typeof electronCat.create === "function") {
    return electronCat.create(name);
  }

  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.message || "Failed to create category" };
  }
  return data;
}

export async function renameCategory(id: string, newName: string): Promise<{ success: boolean; category?: CategoryItem; error?: string }> {
  const electronCat = getElectronCategoryAPI();
  if (electronCat && typeof electronCat.rename === "function") {
    return electronCat.rename(id, newName);
  }

  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.message || "Failed to rename category" };
  }
  return data;
}
