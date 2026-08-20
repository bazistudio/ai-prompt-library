"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  AnalyticsSummary,
} from "@/database/local/analyticsQueries";
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  RefreshCw,
  FolderTree,
} from "lucide-react";

interface AnalyticsDashboardProps {
  initialData?: AnalyticsSummary;
}

export function AnalyticsDashboard({ initialData }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsSummary | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchMetrics();
    }
  }, [initialData]);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        <span>Loading analytics dashboard...</span>
      </div>
    );
  }

  const categoryChartData = data.categoryBreakdown.filter((c) => c.count > 0);
  const projectChartData = data.projectBreakdown;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Library Analytics & Productivity Insights
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time metric breakdowns aggregated locally from your offline SQLite store.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Donut Chart) */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-md shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <PieIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Category Distribution</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {data.totalPrompts} total
            </span>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom Legend */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 max-h-20 overflow-y-auto">
                {categoryChartData.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate max-w-[100px]">{c.name}</span>
                    <span className="font-mono text-foreground font-medium">({c.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground italic">
              No prompt categories logged yet.
            </div>
          )}
        </div>

        {/* Workspace Breakdown (Bar Chart) */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-md shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-info/10 text-info">
                <FolderTree className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Workspace Volumes</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {data.totalWorkspaces} {data.totalWorkspaces === 1 ? "workspace" : "workspaces"}
            </span>
          </div>

          {projectChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.7 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.7 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {projectChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground italic">
              No workspaces available.
            </div>
          )}
        </div>
      </div>

      {/* 14-Day Activity Heat / Trend */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-md shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">14-Day Activity & Version Velocity</h3>
              <p className="text-xs text-muted-foreground">
                Track newly created prompts and iterative version revisions over the last 2 weeks.
              </p>
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorVersions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.7 }} />
              <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.7 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="promptsCreated"
                name="Prompts Created"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCreated)"
              />
              <Area
                type="monotone"
                dataKey="versionsAdded"
                name="Versions Logged"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVersions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Version Depth & Audit Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Single-Version Prompts</span>
            <p className="text-lg font-bold text-foreground font-mono">
              {data.versionDistribution.singleVersion}
            </p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            Initial drafts
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Iterated Prompts (2-3 vers.)</span>
            <p className="text-lg font-bold text-foreground font-mono">
              {data.versionDistribution.moderateVersions}
            </p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">
            Iterative
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Deeply Refined (4+ vers.)</span>
            <p className="text-lg font-bold text-foreground font-mono">
              {data.versionDistribution.deepVersions}
            </p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
            Production grade
          </span>
        </div>
      </div>
    </div>
  );
}
