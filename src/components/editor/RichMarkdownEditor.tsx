"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Quote,
  Smile,
  Image as ImageIcon,
  Link as LinkIcon,
  Columns,
  Eye,
  Edit3,
  FileCode,
  Globe,
  AlertCircle,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { detectLanguageAndDirection, TextDirection, DetectedLanguageInfo } from "./languageDetector";

interface RichMarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  direction?: TextDirection;
  onDirectionChange?: (dir: TextDirection) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function RichMarkdownEditor({
  value,
  onChange,
  direction = "auto",
  onDirectionChange,
  placeholder = "Write your prompt in Markdown, with code snippets, tables, checklists, and images...",
  minHeight = "min-h-[380px]",
  className = "",
}: RichMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Mode: 'edit' | 'split' | 'preview'
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("split");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [detectedLang, setDetectedLang] = useState<DetectedLanguageInfo>({
    direction: "ltr",
    scriptName: "English / Latin",
    languageCode: "en",
    hasRtlCharacters: false,
    hasLtrCharacters: false,
    isMixed: false,
  });

  // Track cursor and selection
  useEffect(() => {
    const langInfo = detectLanguageAndDirection(value);
    setDetectedLang(langInfo);
  }, [value]);

  const activeDirection = direction === "auto" ? detectedLang.direction : direction;

  // Insert helper
  const insertText = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || defaultText;

    const replacement = `${before}${selected}${after}`;
    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 10);
  };

  // Image Upload Handler (Offline Data URL)
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    // Check size limit (max 5MB for clean local storage)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is larger than 5MB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        insertText(`\n![${file.name.replace(/\.[^/.]+$/, "")}](${dataUrl})\n`, "");
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop Image directly onto Editor
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        handleImageFile(file);
      }
    }
  };

  // Checklist interactive toggle in preview
  const handleChecklistToggle = (lineIndex: number, newChecked: boolean) => {
    const lines = value.split(/\r?\n/);
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const match = line.match(/^(\s*-\s*\[)([ xX])(\]\s*.*)$/);
      if (match) {
        lines[lineIndex] = `${match[1]}${newChecked ? "x" : " "}${match[3]}`;
        onChange(lines.join("\n"));
      }
    }
  };

  // Calculate Metrics
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const chars = value.length;
  const readTimeMin = Math.max(1, Math.ceil(words / 200));

  return (
    <div className={`rounded-2xl border border-border bg-card shadow-xs flex flex-col overflow-hidden ${className}`}>
      {/* 1. Main Rich Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-muted/40 border-b border-border text-foreground select-none">
        {/* Left Toolbar: Text formatting */}
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Headings */}
          <button
            type="button"
            title="Heading 1 (# )"
            onClick={() => insertText("# ", "", "Main Title")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 2 (## )"
            onClick={() => insertText("## ", "", "Section Heading")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 3 (### )"
            onClick={() => insertText("### ", "", "Subheading")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            title="Bold (**text**)"
            onClick={() => insertText("**", "**", "bold text")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Italic (*text*)"
            onClick={() => insertText("*", "*", "italic text")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Strikethrough (~~text~~)"
            onClick={() => insertText("~~", "~~", "strikethrough text")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Highlight (==text==)"
            onClick={() => insertText("==", "==", "highlighted note")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Inline Code (`code`)"
            onClick={() => insertText("`", "`", "variable_name")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Code className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Structure & Lists */}
          <button
            type="button"
            title="Bullet List (- )"
            onClick={() => insertText("- ", "", "List item")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Numbered List (1. )"
            onClick={() => insertText("1. ", "", "First step")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Interactive Checklist (- [ ] )"
            onClick={() => insertText("- [ ] ", "", "Task to complete")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CheckSquare className="h-4 w-4 text-primary" />
          </button>
          <button
            type="button"
            title="Quote (> )"
            onClick={() => insertText("> ", "", "Important quote or instruction")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Rich Inserts */}
          <button
            type="button"
            title="Insert Code Block (```lang)"
            onClick={() => insertText("\n```javascript\n", "\n```\n", "// Write code here")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <FileCode className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Insert Table"
            onClick={() => insertText("\n| Parameter | Type | Description |\n| :--- | :--- | :--- |\n| role | string | User role identifier |\n| mode | 'fast' | Execution speed |\n\n", "")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Insert Callout (:::info)"
            onClick={() => insertText("\n:::info\n", "\n:::\n", "Important context or constraint for this prompt")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </button>
          <button
            type="button"
            title="Insert Link [title](url)"
            onClick={() => insertText("[", "](https://example.com)", "Link Title")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <LinkIcon className="h-4 w-4" />
          </button>

          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageFile(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            title="Insert Local Image"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ImageIcon className="h-4 w-4 text-emerald-500" />
          </button>

          {/* Emoji / Icon Popover */}
          <div className="relative">
            <button
              type="button"
              title="Insert Emoji or Icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Smile className="h-4 w-4 text-amber-500" />
            </button>
            <EmojiPickerPopover
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelect={(emoji) => insertText(emoji, "")}
            />
          </div>
        </div>

        {/* Right Toolbar: Direction Switcher & View Mode */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Direction Switcher (Auto, LTR, RTL) */}
          <div className="flex items-center bg-background border border-border rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onDirectionChange?.("auto")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                direction === "auto" ? "bg-muted text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Auto-detect script direction"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => onDirectionChange?.("ltr")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                direction === "ltr" ? "bg-primary text-primary-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Force Left-to-Right (English, Hindi, Chinese, etc.)"
            >
              LTR
            </button>
            <button
              type="button"
              onClick={() => onDirectionChange?.("rtl")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                direction === "rtl" ? "bg-primary text-primary-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Force Right-to-Left (Urdu, Arabic, Hebrew, etc.)"
            >
              RTL
            </button>
          </div>

          <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />

          {/* View Mode Switcher (Edit / Split / Preview) */}
          <div className="flex items-center bg-background border border-border rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "edit" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Editor Only"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`p-1 rounded-md transition-colors cursor-pointer hidden md:flex ${
                viewMode === "split" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Split Editor & Live Preview"
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "preview" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Live Preview Only"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Workspace Body (Editor & Preview Panes) */}
      <div className={`grid flex-1 overflow-hidden ${
        viewMode === "split" ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border" : "grid-cols-1"
      }`}>
        {/* Editor Pane */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className="relative flex flex-col flex-1 bg-background">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onDrop={handleDrop}
              dir={activeDirection}
              placeholder={placeholder}
              className={`w-full p-4 font-mono text-sm leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none scrollbar-thin ${minHeight}`}
              style={{ minHeight: "360px" }}
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex flex-col flex-1 bg-card/60 overflow-y-auto p-4 scrollbar-thin" style={{ minHeight: "360px" }}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50 text-[11px] font-medium text-muted-foreground">
              <span>LIVE FORMATTED PREVIEW</span>
              {detectedLang.isMixed && (
                <span className="text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full">
                  Mixed Bidirectional Text
                </span>
              )}
            </div>
            <MarkdownRenderer
              content={value}
              textDirection={activeDirection}
              interactiveChecklists={true}
              onChecklistToggle={handleChecklistToggle}
            />
          </div>
        )}
      </div>

      {/* 3. Footer Status Bar (Language & Script, Word & Char Counts) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span>
            Script: <strong className="text-foreground font-semibold">{detectedLang.scriptName}</strong>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="uppercase font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded border border-border">
            {activeDirection.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>{words} words</span>
          <span>{chars} characters</span>
          <span className="text-muted-foreground/60 hidden sm:inline">~{readTimeMin} min read</span>
        </div>
      </div>
    </div>
  );
}
