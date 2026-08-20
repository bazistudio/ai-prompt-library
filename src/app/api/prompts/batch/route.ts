import { NextRequest, NextResponse } from "next/server";
import { getSQLiteDB } from "@/database/local/db";
import { v7 as uuidv7 } from "uuid";
import { logAuditEventDb } from "@/database/local/auditQueries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;

    const db = getSQLiteDB();

    let query = `
      SELECT 
        p.id, p.title, p.description, p.category, p.category_id, p.project_id,
        p.is_favorite, p.is_archived, p.current_version, p.text_direction, p.language,
        p.created_at, p.updated_at,
        COALESCE(c.name, p.category) as category_name,
        COALESCE(pr.name, 'General Workspace') as project_name
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE p.is_archived = 0
    `;
    const params: any[] = [];

    if (projectId) {
      query += ` AND p.project_id = ?`;
      params.push(projectId);
    }
    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY p.updated_at DESC`;

    const prompts = db.prepare(query).all(...params) as any[];

    // Fetch versions and tags for each prompt
    const verStmt = db.prepare(`
      SELECT version_number, content, change_summary, created_at
      FROM prompt_versions
      WHERE prompt_id = ?
      ORDER BY version_number ASC
    `);

    const tagStmt = db.prepare(`
      SELECT tag_name FROM prompt_tags WHERE prompt_id = ?
    `);

    const fullPrompts = prompts.map((p) => {
      const versions = verStmt.all(p.id);
      const tags = (tagStmt.all(p.id) as { tag_name: string }[]).map((t) => t.tag_name);

      return {
        id: p.id,
        title: p.title,
        description: p.description || "",
        category: p.category_name,
        categoryId: p.category_id,
        projectName: p.project_name,
        projectId: p.project_id,
        isFavorite: p.is_favorite === 1,
        currentVersion: p.current_version,
        textDirection: p.text_direction || "auto",
        language: p.language || "auto",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        tags,
        versions,
      };
    });

    logAuditEventDb(db, {
      action: "batch.export",
      entity: "library",
      entityId: projectId || "all",
      metadata: { count: fullPrompts.length },
    });

    return NextResponse.json({
      exportVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      count: fullPrompts.length,
      prompts: fullPrompts,
    });
  } catch (err: any) {
    console.error("[API/prompts/batch] Export error:", err);
    return NextResponse.json(
      { error: "Failed to export prompts." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPrompts = Array.isArray(body) ? body : body.prompts;
    const targetProjectId = body.targetProjectId || "proj_default";

    if (!rawPrompts || !Array.isArray(rawPrompts) || rawPrompts.length === 0) {
      return NextResponse.json(
        { error: "No prompts provided for import." },
        { status: 400 }
      );
    }

    const db = getSQLiteDB();
    const now = Date.now();
    const dateSuffix = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

    let importedCount = 0;
    let renamedCount = 0;

    // Pre-fetch existing categories map
    const catRows = db.prepare(`SELECT id, name, folder_name FROM categories`).all() as Array<{
      id: string;
      name: string;
      folder_name: string;
    }>;
    const catMap = new Map<string, { id: string; name: string }>();
    for (const c of catRows) {
      catMap.set(c.name.toLowerCase(), { id: c.id, name: c.name });
      catMap.set(c.folder_name.toLowerCase(), { id: c.id, name: c.name });
    }

    // Default category fallback
    const defaultCat = catMap.get("other") || catMap.get("ai") || { id: "cat_other", name: "Other" };

    const tx = db.transaction(() => {
      for (const item of rawPrompts) {
        if (!item || typeof item !== "object") continue;

        let title = (item.title || "Untitled Imported Prompt").trim();
        const description = (item.description || "").trim();
        const content = (item.content || item.versions?.[0]?.content || "").trim();
        const direction = item.textDirection || item.text_direction || "auto";
        const language = item.language || "auto";
        const tags = Array.isArray(item.tags) ? item.tags : [];

        // 1. Safe Collision Check: Look up title in destination project
        const existingWithTitle = db.prepare(`
          SELECT id FROM prompts 
          WHERE LOWER(title) = LOWER(?) AND project_id = ? AND is_archived = 0
        `).get(title, targetProjectId);

        if (existingWithTitle) {
          title = `${title} (Imported ${dateSuffix})`;
          renamedCount++;
        }

        // 2. Resolve Category safely
        const rawCatName = (item.category || item.categoryName || "Other").trim();
        const resolvedCat = catMap.get(rawCatName.toLowerCase()) || defaultCat;

        // 3. Assign fresh UUIDs (Never overwrite existing items!)
        const promptId = uuidv7();
        const versionId = uuidv7();

        // 4. Insert Prompt
        db.prepare(`
          INSERT INTO prompts (
            id, title, description, category, category_id, project_id,
            is_favorite, is_archived, current_version, text_direction, language,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?, ?)
        `).run(
          promptId,
          title,
          description,
          resolvedCat.name,
          resolvedCat.id,
          targetProjectId,
          direction,
          language,
          now,
          now
        );

        // 5. Insert Version (preserve historical version or create initial v1)
        const versionContent = content || "Imported prompt content";
        db.prepare(`
          INSERT INTO prompt_versions (
            id, prompt_id, version_number, content, change_summary, created_at
          ) VALUES (?, ?, 1, ?, 'Batch imported', ?)
        `).run(versionId, promptId, versionContent, now);

        // 6. Insert Tags
        if (tags.length > 0) {
          const insertTag = db.prepare(`
            INSERT OR IGNORE INTO prompt_tags (id, prompt_id, tag_name)
            VALUES (?, ?, ?)
          `);
          for (const rawTag of tags) {
            const cleanTag = String(rawTag).trim().toLowerCase();
            if (cleanTag) {
              insertTag.run(uuidv7(), promptId, cleanTag);
            }
          }
        }

        importedCount++;
      }

      logAuditEventDb(db, {
        action: "batch.import",
        entity: "library",
        entityId: targetProjectId,
        metadata: { importedCount, renamedCount },
      });
    });

    tx();

    return NextResponse.json({
      success: true,
      importedCount,
      renamedCount,
    });
  } catch (err: any) {
    console.error("[API/prompts/batch] Import error:", err);
    return NextResponse.json(
      { error: "Failed to import prompts." },
      { status: 500 }
    );
  }
}
