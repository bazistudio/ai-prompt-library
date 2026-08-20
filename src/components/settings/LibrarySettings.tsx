"use client";

import { useState, useEffect } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { Toggle } from "./Toggle";
import { Select } from "./Select";

const STORAGE_KEY = "ai-prompt-library:library-preferences";

interface LibraryPreferences {
  view: string;
  sort: string;
  showPreview: boolean;
  showTags: boolean;
  showCategory: boolean;
  confirmDelete: boolean;
  confirmArchive: boolean;
  openPromptsIn: string;
  favoriteBehavior: string;
  archiveBehavior: string;
}

const DEFAULT_PREFERENCES: LibraryPreferences = {
  view: "grid",
  sort: "recently-updated",
  showPreview: true,
  showTags: true,
  showCategory: true,
  confirmDelete: true,
  confirmArchive: true,
  openPromptsIn: "same_tab",
  favoriteBehavior: "highlight",
  archiveBehavior: "hide",
};

export function LibrarySettings() {
  const [prefs, setPrefs] = useState<LibraryPreferences>(DEFAULT_PREFERENCES);

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

  const updatePref = <K extends keyof LibraryPreferences>(key: K, val: LibraryPreferences[K]) => {
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
      {/* 1. Layout & Sorting Defaults */}
      <SettingsSection
        title="Library Layout & Sorting"
        description="Choose how your prompt collection is structured and ordered by default."
      >
        <SettingRow title="Default View" description="Layout mode for displaying prompt card collections.">
          <Select
            value={prefs.view}
            onChange={(v) => updatePref("view", v)}
            options={[
              { value: "grid", label: "Grid View" },
              { value: "list", label: "List View" },
              { value: "compact", label: "Compact List" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Default Sorting" description="Order prompts automatically when opening the library.">
          <Select
            value={prefs.sort}
            onChange={(v) => updatePref("sort", v)}
            options={[
              { value: "recently-updated", label: "Recently Updated" },
              { value: "recently-created", label: "Recently Created" },
              { value: "name-asc", label: "Name A → Z" },
              { value: "name-desc", label: "Name Z → A" },
              { value: "most-used", label: "Most Used" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Open Prompts In" description="Target location when clicking a prompt card.">
          <Select
            value={prefs.openPromptsIn}
            onChange={(v) => updatePref("openPromptsIn", v)}
            options={[
              { value: "same_tab", label: "Same Tab" },
              { value: "new_tab", label: "New Tab" },
            ]}
          />
        </SettingRow>
      </SettingsSection>

      {/* 2. Prompt Display Options */}
      <SettingsSection
        title="Prompt Display Details"
        description="Toggle metadata badges and preview snippets on library cards."
      >
        <SettingRow title="Show Prompt Preview" description="Display a text preview snippet on prompt cards.">
          <Toggle
            checked={prefs.showPreview}
            onChange={(v) => updatePref("showPreview", v)}
            id="toggle-preview"
          />
        </SettingRow>

        <SettingRow title="Show Tags" description="Display tag badges on prompt cards.">
          <Toggle
            checked={prefs.showTags}
            onChange={(v) => updatePref("showTags", v)}
            id="toggle-tags"
          />
        </SettingRow>

        <SettingRow title="Show Category" description="Display category label on prompt cards.">
          <Toggle
            checked={prefs.showCategory}
            onChange={(v) => updatePref("showCategory", v)}
            id="toggle-category"
          />
        </SettingRow>
      </SettingsSection>

      {/* 3. Safety & Behavior */}
      <SettingsSection
        title="Safety & Actions"
        description="Configure deletion and archive confirmation alerts."
      >
        <SettingRow title="Confirm Before Deleting" description="Require confirmation before permanently deleting a prompt.">
          <Toggle
            checked={prefs.confirmDelete}
            onChange={(v) => updatePref("confirmDelete", v)}
            id="toggle-confirm-delete"
          />
        </SettingRow>

        <SettingRow title="Confirm Before Archiving" description="Require confirmation before moving a prompt to archives.">
          <Toggle
            checked={prefs.confirmArchive}
            onChange={(v) => updatePref("confirmArchive", v)}
            id="toggle-confirm-archive"
          />
        </SettingRow>
      </SettingsSection>

      {/* 4. Future-Ready Preferences */}
      <SettingsSection
        title="Organization Behaviors"
        description="Configure favorite highlights and archive visibility."
      >
        <SettingRow title="Favorite Behavior" description="Visual emphasis for starred prompts.">
          <Select
            value={prefs.favoriteBehavior}
            onChange={(v) => updatePref("favoriteBehavior", v)}
            options={[
              { value: "highlight", label: "Highlight Card" },
              { value: "pin-top", label: "Pin to Top" },
            ]}
          />
        </SettingRow>

        <SettingRow title="Archive Behavior" description="Visibility for archived prompts.">
          <Select
            value={prefs.archiveBehavior}
            onChange={(v) => updatePref("archiveBehavior", v)}
            options={[
              { value: "hide", label: "Hide from Main Library" },
              { value: "badge", label: "Keep Visible with Badge" },
            ]}
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}
