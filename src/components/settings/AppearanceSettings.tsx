"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { ThemeSelector } from "./ThemeSelector";
import { ColorPicker } from "./ColorPicker";
import { Toggle } from "./Toggle";
import { Sparkles, Terminal } from "lucide-react";

const primaryPresets = [
  { name: "Purple", hex: "#1A016F" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Cyan", hex: "#0891B2" },
  { name: "Green", hex: "#059669" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Red", hex: "#DC2626" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Indigo", hex: "#4F46E5" },
];

const accentPresets = [
  { name: "Mint", hex: "#C5FFE5" },
  { name: "Sky", hex: "#BAE6FD" },
  { name: "Lavender", hex: "#DDD6FE" },
  { name: "Yellow", hex: "#FEF3A8" },
  { name: "Peach", hex: "#FED7AA" },
  { name: "Rose", hex: "#FECDD3" },
];

export function AppearanceSettings() {
  const {
    primaryColor,
    setPrimaryColor,
    accentColor,
    setAccentColor,
    useAccentHighlights,
    setUseAccentHighlights,
    reduceAnimations,
    setReduceAnimations,
  } = useTheme();

  const getContrastColor = (hex: string): string => {
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return "#ffffff";
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#0b0620" : "#fcf4ff";
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Theme Selection */}
      <SettingsSection
        title="Theme Selection"
        description="Choose your workspace layout visual theme."
      >
        <SettingRow
          title="Application Theme"
          description="Switch between dark, light, or match your operating system theme."
        >
          <ThemeSelector />
        </SettingRow>
      </SettingsSection>

      {/* 2. Color System */}
      <SettingsSection
        title="Brand & Color Palette"
        description="Customize primary brand and secondary accent highlights. Success, warning, and error colors remain unaffected."
      >
        <SettingRow
          title="Primary Brand Color"
          description="Governs primary action buttons, landing page buttons, headers, and primary active states."
        >
          <ColorPicker
            value={primaryColor}
            onChange={setPrimaryColor}
            presets={primaryPresets}
            label="Select Preset Color"
          />
        </SettingRow>

        <SettingRow
          title="Accent Highlight Color"
          description="Governs interactive highlights, category selections, focus rings, and badges."
        >
          <ColorPicker
            value={accentColor}
            onChange={setAccentColor}
            presets={accentPresets}
            label="Select Preset Color"
          />
        </SettingRow>
      </SettingsSection>

      {/* 3. Layout Options */}
      <SettingsSection
        title="Accessibility & Highlights"
        description="Configure focus states, highlights, and animation performance."
      >
        <SettingRow
          title="Highlights Behavior"
          description="Use the accent color instead of primary color for focus rings, checkmarks, and badges."
        >
          <Toggle
            checked={useAccentHighlights}
            onChange={setUseAccentHighlights}
            id="toggle-highlights"
          />
        </SettingRow>

        <SettingRow
          title="Reduce Motion"
          description="Instantly disables all interface transition delays and animations."
        >
          <Toggle
            checked={reduceAnimations}
            onChange={setReduceAnimations}
            id="toggle-motion"
          />
        </SettingRow>
      </SettingsSection>

      {/* 4. Live UI Mockup Preview */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          Theme Preview
        </span>
        <div className="glass-card-glow p-6 rounded-2xl border border-border flex flex-col gap-6 relative overflow-hidden bg-card select-none">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 text-left">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary" style={{ borderColor: primaryColor + "33" }}>
              <Terminal className="h-4.5 w-4.5" style={{ color: useAccentHighlights ? accentColor : primaryColor }} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Interactive Component Preview</span>
              <span className="text-[10px] text-muted-foreground">See how your changes affect colors in real time</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Primary Button Preview */}
            <div className="flex flex-col gap-1 text-left w-full sm:w-auto">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Primary Button
              </span>
              <button
                type="button"
                style={{
                  backgroundColor: primaryColor,
                  color: getContrastColor(primaryColor),
                  boxShadow: `0 4px 14px ${primaryColor}40`,
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg cursor-default border border-transparent"
              >
                Save Prompt
              </button>
            </div>

            {/* Accent Highlights Preview */}
            <div className="flex flex-col gap-1 text-left w-full sm:w-auto">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Navigation Highlight
              </span>
              <div
                style={{
                  color: useAccentHighlights ? accentColor : primaryColor,
                  backgroundColor: (useAccentHighlights ? accentColor : primaryColor) + "10",
                  borderColor: (useAccentHighlights ? accentColor : primaryColor) + "25",
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Selected Category</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
