import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Prompt Library — Your Private AI Prompt Workspace | Bazi Studio",
  description: "An offline-first workspace to organize, create, improve, version, and reuse your AI prompts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{
        ["--font-inter" as any]: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        ["--font-geist-mono" as any]: "'Geist Mono', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
      }}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
