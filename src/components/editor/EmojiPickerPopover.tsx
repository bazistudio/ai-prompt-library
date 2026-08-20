"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emojiOrIcon: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: "AI & Tech",
    items: ["🤖", "🧠", "✨", "⚡", "🔮", "💡", "🚀", "💻", "🔥", "⚙️", "🛠️", "🎯", "📊", "📈", "🧩", "📡", "🌐", "🔒"],
  },
  {
    name: "Prompts & Writing",
    items: ["✍️", "📝", "📄", "📚", "🔖", "📌", "🎨", "🖋️", "📖", "📋", "📂", "🔍", "🔎", "🗣️", "💬", "💭", "🏷️", "⭐"],
  },
  {
    name: "Smileys & Faces",
    items: ["😀", "😃", "😄", "😊", "😎", "🤩", "🧐", "🤔", "🤓", "😇", "🥳", "🙌", "👏", "👍", "🤝", "💪", "💡", "🎉"],
  },
  {
    name: "Status & Badges",
    items: ["✅", "❌", "⚠️", "🚨", "🟢", "🟡", "🔴", "🔵", "🟣", "✔️", "❓", "❗", "🏆", "🥇", "💯", "⏳", "⏱️", "🔄"],
  },
  {
    name: "Symbols & Markers",
    items: ["👉", "👇", "👆", "👈", "➡️", "⬅️", "⬆️", "⬇️", "➔", "▶️", "◀️", "🔷", "🔶", "▪️", "▫️", "•", "✦", "★"],
  },
];

export function EmojiPickerPopover({ isOpen, onClose, onSelect }: EmojiPickerPopoverProps) {
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-12 left-2 z-50 w-72 p-3 rounded-2xl bg-card border border-border shadow-xl shadow-black/15 text-left animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="relative mb-2.5">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons & emojis..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
          autoFocus
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-3 scrollbar-thin pr-1">
        {EMOJI_CATEGORIES.map((cat) => {
          const filtered = cat.items.filter((item) => !search || item.includes(search));
          if (filtered.length === 0) return null;

          return (
            <div key={cat.name} className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                {cat.name}
              </span>
              <div className="grid grid-cols-6 gap-1">
                {filtered.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="h-8 w-8 rounded-lg hover:bg-muted text-base flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
