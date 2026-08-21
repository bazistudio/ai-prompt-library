/**
 * Single Source of Truth for AI Prompt Library v1.0.3 Landing Page
 * Bazi Studio Product Metadata
 */

export interface ProductConfig {
  productName: string;
  brandName: string;
  version: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  githubUrl: string;
  downloadUrl: string;
  pricing: {
    demo: {
      title: string;
      price: string;
      period: string;
      durationDays: number;
      promptLimit: number;
      workspaceLimit: number;
      features: string[];
      ctaText: string;
    };
    lifetime: {
      title: string;
      price: string;
      period: string;
      currency: string;
      amount: number;
      features: string[];
      ctaText: string;
    };
  };
  videos: Array<{
    id: string;
    title: string;
    description: string;
    youtubeUrl: string;
    thumbnailUrl: string;
  }>;
  publicStats?: {
    downloads?: number;
    latestVersion: string;
    releaseDate: string;
    productStatus: string;
    platform: string;
  };
}

export const landingConfig: ProductConfig = {
  productName: "AI Prompt Library",
  brandName: "Bazi Studio",
  version: "1.0.3",
  tagline: "Your Private AI Prompt Workspace",
  heroHeadline: "Your Private AI Prompt Workspace",
  heroSubtitle:
    "Organize, create, improve, version, and reuse your AI prompts in a private, offline-first workspace built for serious AI work.",
  githubUrl: "https://github.com/bazistudio/ai-prompt-library",
  downloadUrl: "https://github.com/bazistudio/ai-prompt-library/releases/latest",
  pricing: {
    demo: {
      title: "10-Day Demo",
      price: "Free",
      period: "10 Days Trial",
      durationDays: 10,
      promptLimit: 10,
      workspaceLimit: 1,
      features: [
        "10-day evaluation access",
        "Up to 10 prompts in local library",
        "1 prompt engineering workspace",
        "Offline SQLite local storage",
        "Rich markdown prompt editor",
        "Immutable version logging",
      ],
      ctaText: "Download Free Demo",
    },
    lifetime: {
      title: "Lifetime Access",
      price: "PKR 2,000",
      period: "One-time payment",
      currency: "PKR",
      amount: 2000,
      features: [
        "One-time payment • Lifetime access",
        "Unlimited local prompts & tags",
        "Multiple workspaces & projects",
        "AI Playground with Gemini integration",
        "Multi-step prompt workflows & pipelines",
        "Local SQLite backup & ZIP archive exports",
        "Windows desktop application",
      ],
      ctaText: "Get Lifetime Access",
    },
  },
  videos: [], // Currently pending official Bazi Studio YouTube releases
  publicStats: {
    latestVersion: "1.0.3",
    releaseDate: "2026-08-20",
    productStatus: "available",
    platform: "Windows Desktop",
  },
};
