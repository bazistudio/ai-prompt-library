"use client";

import { useState, useEffect } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { Toggle } from "./Toggle";
import { Select } from "./Select";

const STORAGE_KEY = "ai-prompt-library:editor-preferences";

interface EditorPreferences {
  font: string;
  fontSize: string;
  editorWidth: string;
  wordWrap: boolean;
  lineNumbers: boolean;
  showWhitespace: boolean;
  autoSave: boolean;
  autoSaveInterval: string;
  confirmUnsaved: boolean;
  defaultPromptView: string;
  defaultVariableDisplay: string;
}

const DEFAULT_PREFERENCES: EditorPreferences = {
  font: "Inter",
  fontSize: "medium",
  editorWidth: "comfortable",
  wordWrap: true,
  lineNumbers: false,
  showWhitespace: false,
  autoSave: true,
  autoSaveInterval: "30",
  confirmUnsaved: true,
  defaultPromptView: "editor",
  defaultVariableDisplay: "inline",
};

export function PromptEditorSettings() {
  const [prefs, setPrefs] = useState<EditorPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
         
        setPrefs({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch {
      // Fall back to defaults if corrupted
    }
  }, []);

  const updatePref = <K extends keyof EditorPreferences>(key: K, val: EditorPreferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota limits
      }
      return next;
    });
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Editor Formatting */}
      <SettingsSection
        title="Editor Formatting"
        description="Customize typography, font size, and editor layout boundaries."
      >
        <SettingRow title="Editor Font" description="Select the font family used in the prompt workspace.">
          <Select
            value={prefs.font}
            onChange={(v) => updatePref("font", v)}
            options={[
              { value: "Inter", label: "Inter (Sans)" },
              { value: "Geist Mono", label: "Geist Mono (Monospace)" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Font Size" description="Adjust text scale inside the prompt editor.">
          <Select
            value={prefs.fontSize}
            onChange={(v) => updatePref("fontSize", v)}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Editor Width" description="Control the horizontal content width of the editor container.">
          <Select
            value={prefs.editorWidth}
            onChange={(v) => updatePref("editorWidth", v)}
            options={[
              { value: "compact", label: "Compact" },
              { value: "comfortable", label: "Comfortable" },
              { value: "wide", label: "Wide" },
              { value: "full", label: "Full Width" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Word Wrap" description="Automatically wrap long text lines to fit the editor container.">
          <Toggle
            checked={prefs.wordWrap}
            onChange={(v) => updatePref("wordWrap", v)}
            id="toggle-wordwrap"
          />
        </SettingRow>

        <SettingRow title="Line Numbers" description="Display line numbers along the left margin of the editor.">
          <Toggle
            checked={prefs.lineNumbers}
            onChange={(v) => updatePref("lineNumbers", v)}
            id="toggle-linenumbers"
          />
        </SettingRow>

        <SettingRow title="Show Whitespace" description="Render subtle glyphs for spaces, tabs, and line breaks.">
          <Toggle
            checked={prefs.showWhitespace}
            onChange={(v) => updatePref("showWhitespace", v)}
            id="toggle-whitespace"
          />
        </SettingRow>
      </SettingsSection>

      {/* 2. Behavior */}
      <SettingsSection
        title="Editor Behavior"
        description="Configure automatic saving and confirmation alerts."
      >
        <SettingRow title="Auto-save Prompts" description="Periodically save draft changes while typing.">
          <Toggle
            checked={prefs.autoSave}
            onChange={(v) => updatePref("autoSave", v)}
            id="toggle-autosave"
          />
        </SettingRow>

        {prefs.autoSave && (
          <SettingRow title="Auto-save Interval" description="Frequency for background auto-saving.">
            <Select
              value={prefs.autoSaveInterval}
              onChange={(v) => updatePref("autoSaveInterval", v)}
              options={[
                { value: "5", label: "5 seconds" },
                { value: "10", label: "10 seconds" },
                { value: "30", label: "30 seconds" },
                { value: "60", label: "60 seconds" },
              ]}
            />
          </SettingRow>
        )}

        <SettingRow title="Confirm Unsaved Changes" description="Prompt for confirmation before leaving an unsaved prompt.">
          <Toggle
            checked={prefs.confirmUnsaved}
            onChange={(v) => updatePref("confirmUnsaved", v)}
            id="toggle-confirm-unsaved"
          />
        </SettingRow>
      </SettingsSection>

      {/* 3. Prompt Defaults */}
      <SettingsSection
        title="Prompt Defaults"
        description="Configure default view modes and variable panel displays."
      >
        <SettingRow title="Default Mode" description="Initial view mode when opening a prompt.">
          <Select
            value={prefs.defaultPromptView}
            onChange={(v) => updatePref("defaultPromptView", v)}
            options={[
              { value: "editor", label: "Editor" },
              { value: "preview", label: "Preview" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Variable Display" description="Positioning for template {{variable}} placeholders.">
          <Select
            value={prefs.defaultVariableDisplay}
            onChange={(v) => updatePref("defaultVariableDisplay", v)}
            options={[
              { value: "inline", label: "Inline" },
              { value: "panel", label: "Side Panel" },
            ]}
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}
