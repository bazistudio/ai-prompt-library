export interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
  prompt_count?: number;
  created_at: number;
  updated_at: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export async function fetchProjects(): Promise<ProjectItem[]> {
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      throw new Error(`Failed to fetch projects: ${res.statusText}`);
    }
    const data = await res.json();
    return data.projects || [];
  } catch (err) {
    console.error("[ProjectService] Error fetching projects:", err);
    return [];
  }
}

export async function createProject(input: CreateProjectInput): Promise<{ success: boolean; project?: ProjectItem; error?: string }> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create project" };
  }
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<{ success: boolean; project?: ProjectItem; error?: string }> {
  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update project" };
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete project" };
  }
}
