import type { Database } from "better-sqlite3";

export interface CategoryMetric {
  name: string;
  count: number;
  color?: string;
}

export interface ProjectMetric {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface ActivityTrendPoint {
  date: string;
  promptsCreated: number;
  versionsAdded: number;
}

export interface AnalyticsSummary {
  totalPrompts: number;
  totalFavorites: number;
  totalVersions: number;
  totalWorkspaces: number;
  categoryBreakdown: CategoryMetric[];
  projectBreakdown: ProjectMetric[];
  activityTrend: ActivityTrendPoint[];
  versionDistribution: {
    singleVersion: number;
    moderateVersions: number; // 2-3 versions
    deepVersions: number; // 4+ versions
  };
  recentAuditCount: number;
}

const CATEGORY_COLORS = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#64748b", // Slate
];

export function getAnalyticsSummaryDb(db: Database): AnalyticsSummary {
  // 1. Core tallies
  const totalPrompts = (db.prepare(`SELECT COUNT(*) as count FROM prompts WHERE is_archived = 0`).get() as any)?.count || 0;
  const totalFavorites = (db.prepare(`SELECT COUNT(*) as count FROM prompts WHERE is_favorite = 1 AND is_archived = 0`).get() as any)?.count || 0;
  const totalVersions = (db.prepare(`SELECT COUNT(*) as count FROM prompt_versions`).get() as any)?.count || 0;
  const totalWorkspaces = (db.prepare(`SELECT COUNT(*) as count FROM projects`).get() as any)?.count || 0;
  const recentAuditCount = (db.prepare(`SELECT COUNT(*) as count FROM audit_log`).get() as any)?.count || 0;

  // 2. Category distribution
  const catRows = db.prepare(`
    SELECT 
      COALESCE(c.name, p.category, 'Other') as name,
      COUNT(p.id) as count
    FROM prompts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_archived = 0
    GROUP BY name
    ORDER BY count DESC
  `).all() as Array<{ name: string; count: number }>;

  const categoryBreakdown: CategoryMetric[] = catRows.map((row, idx) => ({
    name: row.name,
    count: row.count,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  // 3. Workspace / Project distribution
  const projRows = db.prepare(`
    SELECT 
      COALESCE(pr.id, 'proj_default') as id,
      COALESCE(pr.name, 'General Workspace') as name,
      COALESCE(pr.color, '#6366f1') as color,
      COUNT(p.id) as count
    FROM prompts p
    LEFT JOIN projects pr ON p.project_id = pr.id
    WHERE p.is_archived = 0
    GROUP BY pr.id, pr.name, pr.color
    ORDER BY count DESC
  `).all() as Array<{ id: string; name: string; color: string; count: number }>;

  const projectBreakdown: ProjectMetric[] = projRows;

  // 4. 14-Day Activity Trend (Prompts created and versions added per day)
  const now = Date.now();
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const promptDates = db.prepare(`
    SELECT 
      date(created_at / 1000, 'unixepoch', 'localtime') as day,
      COUNT(*) as count
    FROM prompts
    WHERE created_at >= ?
    GROUP BY day
  `).all(fourteenDaysAgo) as Array<{ day: string; count: number }>;

  const versionDates = db.prepare(`
    SELECT 
      date(created_at / 1000, 'unixepoch', 'localtime') as day,
      COUNT(*) as count
    FROM prompt_versions
    WHERE created_at >= ?
    GROUP BY day
  `).all(fourteenDaysAgo) as Array<{ day: string; count: number }>;

  // Build daily timeline array
  const dailyMap = new Map<string, { created: number; versions: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    dailyMap.set(dayStr, { created: 0, versions: 0 });
  }

  for (const p of promptDates) {
    if (dailyMap.has(p.day)) {
      dailyMap.get(p.day)!.created = p.count;
    }
  }

  for (const v of versionDates) {
    if (dailyMap.has(v.day)) {
      dailyMap.get(v.day)!.versions = v.count;
    }
  }

  const activityTrend: ActivityTrendPoint[] = Array.from(dailyMap.entries()).map(
    ([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      promptsCreated: data.created,
      versionsAdded: data.versions,
    })
  );

  // 5. Version Depth Distribution
  const versionDistRows = db.prepare(`
    SELECT 
      SUM(CASE WHEN current_version <= 1 THEN 1 ELSE 0 END) as single_count,
      SUM(CASE WHEN current_version >= 2 AND current_version <= 3 THEN 1 ELSE 0 END) as moderate_count,
      SUM(CASE WHEN current_version >= 4 THEN 1 ELSE 0 END) as deep_count
    FROM prompts
    WHERE is_archived = 0
  `).get() as { single_count: number; moderate_count: number; deep_count: number } | undefined;

  return {
    totalPrompts,
    totalFavorites,
    totalVersions,
    totalWorkspaces,
    categoryBreakdown,
    projectBreakdown,
    activityTrend,
    versionDistribution: {
      singleVersion: versionDistRows?.single_count || 0,
      moderateVersions: versionDistRows?.moderate_count || 0,
      deepVersions: versionDistRows?.deep_count || 0,
    },
    recentAuditCount,
  };
}
