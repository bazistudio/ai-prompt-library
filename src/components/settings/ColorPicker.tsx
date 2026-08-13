"use client";

import { useState, useEffect } from "react";
import { Check, Paintbrush } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets: { name: string; hex: string }[];
  label: string;
}

export function ColorPicker({ value, onChange, presets, label }: ColorPickerProps) {
  const [customVal, setCustomVal] = useState(value);

  // Sync state if value changes externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomVal(value);
  }, [value]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomVal(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  const getContrastColor = (hex: string): string => {
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return "#ffffff";
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#0b0620" : "#ffffff";
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      
      {/* Preset Grid */}
      <div className="flex flex-wrap gap-2.5">
        {presets.map((preset) => {
          const isSelected = value.toLowerCase() === preset.hex.toLowerCase();
          const checkColor = getContrastColor(preset.hex);
          return (
            <button
              key={preset.hex}
              onClick={() => {
                onChange(preset.hex);
                setCustomVal(preset.hex);
              }}
              style={{ backgroundColor: preset.hex }}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              title={preset.name}
            >
              {isSelected && (
                <Check className="h-4.5 w-4.5" style={{ color: checkColor }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Picker and Hex Text Field */}
      <div className="flex items-center gap-2 max-w-[180px] mt-1">
        <div className="relative h-9 w-9 rounded-lg border border-border overflow-hidden shrink-0 bg-card cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setCustomVal(e.target.value);
            }}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          />
          <div
            style={{ backgroundColor: value }}
            className="h-full w-full flex items-center justify-center"
          >
            <Paintbrush className="h-4 w-4" style={{ color: getContrastColor(value) }} />
          </div>
        </div>
        <input
          type="text"
          value={customVal}
          onChange={handleCustomChange}
          maxLength={7}
          placeholder="#FFFFFF"
          className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary uppercase"
        />
      </div>
    </div>
  );
}
