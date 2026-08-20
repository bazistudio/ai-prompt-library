"use client";

import React, { useState } from "react";
import { Check, Copy, Info, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  textDirection?: "ltr" | "rtl" | "auto";
  onChecklistToggle?: (lineIndex: number, newChecked: boolean) => void;
  interactiveChecklists?: boolean;
}

export function MarkdownRenderer({
  content,
  className = "",
  textDirection = "auto",
  onChecklistToggle,
  interactiveChecklists = false,
}: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return (
      <div className={`text-muted-foreground italic text-sm p-4 text-center ${className}`}>
        No content written yet.
      </div>
    );
  }

  // Parse lines for blocks
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Blocks (```)
    if (line.trim().startsWith("```")) {
      const lang = line.trim().replace(/^```/, "").trim() || "plaintext";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      const fullCode = codeLines.join("\n");
      elements.push(
        <CodeBlock key={`code-${i}`} code={fullCode} language={lang} />
      );
      continue;
    }

    // 2. Callout Containers (:::info, :::warning, :::success, :::danger)
    if (line.trim().startsWith(":::info") || line.trim().startsWith(":::warning") || line.trim().startsWith(":::success") || line.trim().startsWith(":::danger")) {
      const typeMatch = line.trim().match(/^:::(info|warning|success|danger)/);
      const calloutType = typeMatch ? typeMatch[1] : "info";
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        calloutLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::
      elements.push(
        <CalloutBlock key={`callout-${i}`} type={calloutType} text={calloutLines.join("\n")} />
      );
      continue;
    }

    // 3. Tables (| Header | Header |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(<TableBlock key={`table-${i}`} tableLines={tableLines} />);
      continue;
    }

    // 4. Interactive Checklists (- [ ] or - [x])
    const checklistMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      const isChecked = checklistMatch[2].toLowerCase() === "x";
      const itemText = checklistMatch[3];
      const currentLineIdx = i;

      elements.push(
        <div key={`check-${i}`} className="flex items-start gap-2.5 my-1.5 px-1 group" dir="auto">
          <button
            type="button"
            disabled={!interactiveChecklists}
            onClick={() => {
              if (onChecklistToggle) {
                onChecklistToggle(currentLineIdx, !isChecked);
              }
            }}
            className={`mt-0.5 h-4.5 w-4.5 rounded flex items-center justify-center border transition-colors ${
              isChecked
                ? "bg-primary border-primary text-primary-foreground"
                : "border-input bg-background hover:bg-muted text-transparent"
            } ${interactiveChecklists ? "cursor-pointer" : "cursor-default"}`}
          >
            <Check className="h-3 w-3 stroke-[3]" />
          </button>
          <span className={`text-sm leading-relaxed ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {renderInlineMarkdown(itemText)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 5. Headings (# H1, ## H2, ### H3, #### H4)
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold text-foreground mt-5 mb-2.5 tracking-tight border-b border-border/40 pb-1.5" dir="auto">
          <bdi>{renderInlineMarkdown(line.substring(2))}</bdi>
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-semibold text-foreground mt-4 mb-2 tracking-tight" dir="auto">
          <bdi>{renderInlineMarkdown(line.substring(3))}</bdi>
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold text-foreground mt-3 mb-1.5" dir="auto">
          <bdi>{renderInlineMarkdown(line.substring(4))}</bdi>
        </h3>
      );
      i++;
      continue;
    }

    // 6. Blockquote (> text)
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-primary/60 pl-3.5 py-1.5 my-2.5 italic text-muted-foreground bg-muted/20 rounded-r-lg" dir="auto">
          <bdi>{renderInlineMarkdown(line.substring(2))}</bdi>
        </blockquote>
      );
      i++;
      continue;
    }

    // 7. Horizontal Rule (---, ***)
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={`hr-${i}`} className="my-5 border-border" />);
      i++;
      continue;
    }

    // 8. Image Block (![alt](src))
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      elements.push(
        <ImageBlock key={`img-${i}`} alt={imgMatch[1]} src={imgMatch[2]} />
      );
      i++;
      continue;
    }

    // 9. Standard Unordered List (- item or * item)
    if (line.match(/^(\s*)[-*]\s+(.*)$/)) {
      const match = line.match(/^(\s*)[-*]\s+(.*)$/)!;
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 px-1" dir="auto">
          <span className="text-primary font-bold mt-0.5">•</span>
          <span className="text-sm text-foreground leading-relaxed">
            <bdi>{renderInlineMarkdown(match[2])}</bdi>
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 10. Ordered List (1. item)
    if (line.match(/^(\s*)\d+\.\s+(.*)$/)) {
      const match = line.match(/^(\s*)(\d+)\.\s+(.*)$/)!;
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 my-1 px-1" dir="auto">
          <span className="text-xs font-semibold text-muted-foreground mt-0.5 min-w-4 text-right">
            {match[2]}.
          </span>
          <span className="text-sm text-foreground leading-relaxed">
            <bdi>{renderInlineMarkdown(match[3])}</bdi>
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 11. Empty lines
    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 12. Standard Paragraph with Bidirectional text isolation
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-foreground my-1.5" dir="auto">
        <bdi>{renderInlineMarkdown(line)}</bdi>
      </p>
    );
    i++;
  }

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none text-left ${className}`}
      dir={textDirection === "auto" ? "auto" : textDirection}
    >
      {elements}
    </div>
  );
}

// ---------------- Helper Components ---------------- //

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-border bg-muted/40 font-mono text-xs shadow-xs" dir="ltr">
      <div className="flex items-center justify-between px-3.5 py-2 bg-muted/80 border-b border-border text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-background border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-foreground font-mono leading-relaxed select-text whitespace-pre">
        {code}
      </div>
    </div>
  );
}

function CalloutBlock({ type, text }: { type: string; text: string }) {
  const configs: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: {
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      border: "border-blue-500/30",
      text: "text-blue-700 dark:text-blue-300",
      icon: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      border: "border-amber-500/30",
      text: "text-amber-800 dark:text-amber-300",
      icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/30",
      text: "text-emerald-800 dark:text-emerald-300",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
    },
    danger: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      border: "border-rose-500/30",
      text: "text-rose-800 dark:text-rose-300",
      icon: <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />,
    },
  };

  const cfg = configs[type] || configs.info;

  return (
    <div className={`my-3 p-3.5 rounded-xl border flex items-start gap-3 ${cfg.bg} ${cfg.border}`} dir="auto">
      {cfg.icon}
      <div className={`text-xs sm:text-sm leading-relaxed ${cfg.text} space-y-1`}>
        {text.split("\n").map((line, idx) => (
          <p key={idx}><bdi>{renderInlineMarkdown(line)}</bdi></p>
        ))}
      </div>
    </div>
  );
}

function TableBlock({ tableLines }: { tableLines: string[] }) {
  if (tableLines.length < 2) return null;

  // Split headers and rows
  const parseRow = (line: string) => {
    return line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  };

  const headers = parseRow(tableLines[0]);
  // Line 1 is the separator (| --- | --- |)
  const rows = tableLines.slice(2).map(parseRow);

  return (
    <div className="my-3.5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-muted/80 text-foreground font-semibold border-b border-border">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-3.5 py-2.5 font-medium border-r border-border last:border-r-0" dir="auto">
                <bdi>{renderInlineMarkdown(h)}</bdi>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-foreground/90 border-r border-border last:border-r-0" dir="auto">
                  <bdi>{renderInlineMarkdown(cell)}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImageBlock({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-border bg-muted/20 flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "Prompt illustration"}
        className="max-h-96 w-auto max-w-full object-contain rounded-lg shadow-xs"
        loading="lazy"
      />
      {alt && (
        <span className="text-[11px] text-muted-foreground italic py-1.5 text-center px-4">
          {alt}
        </span>
      )}
    </div>
  );
}

// ---------------- Inline Formatter ---------------- //

function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return "";

  // Split by inline tags (bold, italic, code, highlights, links)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex patterns
  const linkRegex = /\[(.*?)\]\((.*?)\)/;
  const boldRegex = /\*\*(.*?)\*\*/;
  const italicRegex = /\*(.*?)\*/;
  const strikeRegex = /~~(.*?)~~/;
  const codeSpanRegex = /`([^`]+)`/;
  const highlightRegex = /==(.*?)==/;
  const markRegex = /<mark>(.*?)<\/mark>/;

  while (remaining.length > 0) {
    // Find closest match among all patterns
    const matches = [
      { type: "link", match: remaining.match(linkRegex) },
      { type: "bold", match: remaining.match(boldRegex) },
      { type: "italic", match: remaining.match(italicRegex) },
      { type: "strike", match: remaining.match(strikeRegex) },
      { type: "code", match: remaining.match(codeSpanRegex) },
      { type: "highlight", match: remaining.match(highlightRegex) },
      { type: "mark", match: remaining.match(markRegex) },
    ].filter((m) => m.match && m.match.index !== undefined);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Sort by earliest occurrence
    matches.sort((a, b) => a.match!.index! - b.match!.index!);
    const first = matches[0];
    const matchIdx = first.match!.index!;
    const fullMatch = first.match![0];

    // Push text before match
    if (matchIdx > 0) {
      parts.push(remaining.substring(0, matchIdx));
    }

    // Format match
    if (first.type === "link") {
      const title = first.match![1];
      const url = first.match![2];
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5"
        >
          {title}
          <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-70" />
        </a>
      );
    } else if (first.type === "bold") {
      parts.push(<strong key={`b-${keyIdx++}`} className="font-bold text-foreground">{first.match![1]}</strong>);
    } else if (first.type === "italic") {
      parts.push(<em key={`i-${keyIdx++}`} className="italic">{first.match![1]}</em>);
    } else if (first.type === "strike") {
      parts.push(<span key={`s-${keyIdx++}`} className="line-through text-muted-foreground">{first.match![1]}</span>);
    } else if (first.type === "code") {
      parts.push(
        <code key={`c-${keyIdx++}`} className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-[11px]">
          {first.match![1]}
        </code>
      );
    } else if (first.type === "highlight" || first.type === "mark") {
      parts.push(
        <mark key={`h-${keyIdx++}`} className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800/60 text-amber-950 dark:text-amber-100 font-medium">
          {first.match![1]}
        </mark>
      );
    }

    remaining = remaining.substring(matchIdx + fullMatch.length);
  }

  return parts;
}
