import { WorkflowItem, WorkflowStepItem } from "@/database/local/workflowQueries";
export type { WorkflowItem, WorkflowStepItem };

export async function fetchWorkflows(): Promise<WorkflowItem[]> {
  try {
    const res = await fetch("/api/workflows");
    if (!res.ok) throw new Error("Failed to load workflows");
    const data = await res.json();
    return data.workflows || [];
  } catch (err) {
    console.error("fetchWorkflows error:", err);
    return [];
  }
}

export async function fetchWorkflowById(id: string): Promise<WorkflowItem | null> {
  try {
    const res = await fetch(`/api/workflows/${id}`);
    if (!res.ok) throw new Error("Failed to load workflow");
    const data = await res.json();
    return data.workflow || null;
  } catch (err) {
    console.error("fetchWorkflowById error:", err);
    return null;
  }
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  category?: string;
  steps?: Array<{
    step_name: string;
    provider?: string;
    model?: string;
    prompt_content: string;
    system_instruction?: string;
    temperature?: number;
    max_tokens?: number;
  }>;
}): Promise<WorkflowItem> {
  const res = await fetch("/api/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create workflow");
  }
  const json = await res.json();
  return json.workflow;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  category?: string;
  is_favorite?: boolean;
  steps?: Array<{
    id?: string;
    step_name: string;
    provider?: any;
    model?: string;
    prompt_content: string;
    system_instruction?: string;
    temperature?: number;
    max_tokens?: number;
  }>;
}

export async function updateWorkflow(
  id: string,
  data: UpdateWorkflowInput
): Promise<WorkflowItem> {
  const res = await fetch(`/api/workflows/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update workflow");
  }
  const json = await res.json();
  return json.workflow;
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const res = await fetch(`/api/workflows/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}
