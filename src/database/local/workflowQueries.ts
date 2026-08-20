import type { Database } from "better-sqlite3";
import { v7 as uuidv7 } from "uuid";
import { AIProvider } from "@/services/ai/aiTypes";

export interface WorkflowStepItem {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  provider: AIProvider;
  model: string;
  prompt_content: string;
  system_instruction?: string;
  temperature: number;
  max_tokens: number;
  created_at: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_favorite: boolean;
  steps: WorkflowStepItem[];
  created_at: number;
  updated_at: number;
}

export function getAllWorkflowsDb(db: Database): WorkflowItem[] {
  const rows = db
    .prepare(`SELECT * FROM workflows ORDER BY updated_at DESC`)
    .all() as Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    is_favorite: number;
    created_at: number;
    updated_at: number;
  }>;

  const stepStmt = db.prepare(
    `SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order ASC`
  );

  return rows.map((r) => {
    const steps = stepStmt.all(r.id) as any[];
    return {
      id: r.id,
      name: r.name,
      description: r.description || undefined,
      category: r.category,
      is_favorite: Boolean(r.is_favorite),
      steps: steps.map((s) => ({
        id: s.id,
        workflow_id: s.workflow_id,
        step_order: s.step_order,
        step_name: s.step_name,
        provider: s.provider as AIProvider,
        model: s.model,
        prompt_content: s.prompt_content,
        system_instruction: s.system_instruction || undefined,
        temperature: s.temperature ?? 0.7,
        max_tokens: s.max_tokens ?? 2048,
        created_at: s.created_at,
      })),
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });
}

export function getWorkflowByIdDb(db: Database, id: string): WorkflowItem | null {
  const r = db
    .prepare(`SELECT * FROM workflows WHERE id = ?`)
    .get(id) as
    | {
        id: string;
        name: string;
        description: string | null;
        category: string;
        is_favorite: number;
        created_at: number;
        updated_at: number;
      }
    | undefined;

  if (!r) return null;

  const steps = db
    .prepare(
      `SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order ASC`
    )
    .all(r.id) as any[];

  return {
    id: r.id,
    name: r.name,
    description: r.description || undefined,
    category: r.category,
    is_favorite: Boolean(r.is_favorite),
    steps: steps.map((s) => ({
      id: s.id,
      workflow_id: s.workflow_id,
      step_order: s.step_order,
      step_name: s.step_name,
      provider: s.provider as AIProvider,
      model: s.model,
      prompt_content: s.prompt_content,
      system_instruction: s.system_instruction || undefined,
      temperature: s.temperature ?? 0.7,
      max_tokens: s.max_tokens ?? 2048,
      created_at: s.created_at,
    })),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export function createWorkflowDb(
  db: Database,
  data: {
    name: string;
    description?: string;
    category?: string;
    steps?: Array<{
      step_name: string;
      provider?: AIProvider;
      model?: string;
      prompt_content: string;
      system_instruction?: string;
      temperature?: number;
      max_tokens?: number;
    }>;
  }
): WorkflowItem {
  const id = uuidv7();
  const now = Date.now();
  const category = data.category || "General";

  const insertWorkflow = db.prepare(`
    INSERT INTO workflows (id, name, description, category, is_favorite, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `);

  insertWorkflow.run(id, data.name, data.description || null, category, now, now);

  const insertStep = db.prepare(`
    INSERT INTO workflow_steps (id, workflow_id, step_order, step_name, provider, model, prompt_content, system_instruction, temperature, max_tokens, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialSteps = data.steps && data.steps.length > 0 ? data.steps : [
    {
      step_name: "Step 1: Ideation & Outline",
      provider: "gemini" as AIProvider,
      model: "gemini-3.7-flash",
      prompt_content: "Generate 5 distinct, high-impact concepts for {{topic}}.",
      system_instruction: "Be concise and innovative.",
      temperature: 0.7,
      max_tokens: 1024,
    },
    {
      step_name: "Step 2: Deep Expansion",
      provider: "gemini" as AIProvider,
      model: "gemini-3.7-flash",
      prompt_content: "Take the best concept from the previous step:\n\n{{step_1.output}}\n\nDevelop a comprehensive implementation specification.",
      system_instruction: "Structure clearly with markdown headings.",
      temperature: 0.6,
      max_tokens: 2048,
    },
  ];

  initialSteps.forEach((s, idx) => {
    insertStep.run(
      uuidv7(),
      id,
      idx + 1,
      s.step_name,
      s.provider || "gemini",
      s.model || "gemini-3.7-flash",
      s.prompt_content,
      s.system_instruction || null,
      s.temperature ?? 0.7,
      s.max_tokens ?? 2048,
      now
    );
  });

  return getWorkflowByIdDb(db, id)!;
}

export function updateWorkflowDb(
  db: Database,
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    is_favorite?: boolean;
    steps?: Array<{
      step_name: string;
      provider?: AIProvider;
      model?: string;
      prompt_content: string;
      system_instruction?: string;
      temperature?: number;
      max_tokens?: number;
    }>;
  }
): WorkflowItem | null {
  const existing = getWorkflowByIdDb(db, id);
  if (!existing) return null;

  const now = Date.now();

  const updates: string[] = ["updated_at = ?"];
  const params: any[] = [now];

  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description || null);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    params.push(data.category);
  }
  if (data.is_favorite !== undefined) {
    updates.push("is_favorite = ?");
    params.push(data.is_favorite ? 1 : 0);
  }

  params.push(id);
  db.prepare(`UPDATE workflows SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  if (data.steps) {
    db.prepare(`DELETE FROM workflow_steps WHERE workflow_id = ?`).run(id);

    const insertStep = db.prepare(`
      INSERT INTO workflow_steps (id, workflow_id, step_order, step_name, provider, model, prompt_content, system_instruction, temperature, max_tokens, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.steps.forEach((s, idx) => {
      insertStep.run(
        uuidv7(),
        id,
        idx + 1,
        s.step_name,
        s.provider || "gemini",
        s.model || "gemini-3.7-flash",
        s.prompt_content,
        s.system_instruction || null,
        s.temperature ?? 0.7,
        s.max_tokens ?? 2048,
        now
      );
    });
  }

  return getWorkflowByIdDb(db, id);
}

export function deleteWorkflowDb(db: Database, id: string): boolean {
  const res = db.prepare(`DELETE FROM workflows WHERE id = ?`).run(id);
  return res.changes > 0;
}
