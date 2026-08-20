/**
 * AI Prompt Template Engine
 * 
 * Extracts, validates, and renders dynamic template variables (e.g. {{variable_name}} or {{variable:default_value}}).
 * Non-destructive and 100% compatible with CommonMark/GFM formatting.
 */

export interface TemplateVariable {
  name: string;
  rawKey: string;
  defaultValue?: string;
  description?: string;
  required: boolean;
}

/**
 * Regular expression to match template variables:
 * Supports:
 * - {{variable_name}}
 * - {{variable_name:default value}}
 * - {{ variable_name : default value }}
 */
export const TEMPLATE_VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_\-\.]+?)(?:\s*:\s*([^}]+?))?\s*\}\}/g;

/**
 * Extract all unique template variables from prompt text
 */
export function extractTemplateVariables(content: string): TemplateVariable[] {
  if (!content || typeof content !== "string") return [];

  const variablesMap = new Map<string, TemplateVariable>();
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const rawName = match[1].trim();
    const defaultValue = match[2] !== undefined ? match[2].trim() : undefined;
    const normalizedKey = rawName.toLowerCase();

    if (!variablesMap.has(normalizedKey)) {
      variablesMap.set(normalizedKey, {
        name: rawName,
        rawKey: normalizedKey,
        defaultValue,
        required: defaultValue === undefined || defaultValue === "",
      });
    } else if (defaultValue !== undefined) {
      // If previously discovered without default but this occurrence has one, record default
      const existing = variablesMap.get(normalizedKey)!;
      if (!existing.defaultValue) {
        existing.defaultValue = defaultValue;
        existing.required = false;
      }
    }
  }

  return Array.from(variablesMap.values());
}

/**
 * Replace all placeholder variables with provided values
 */
export function renderTemplate(
  content: string,
  values: Record<string, string>
): {
  renderedText: string;
  replacedCount: number;
  unfilledVariables: string[];
} {
  if (!content || typeof content !== "string") {
    return { renderedText: "", replacedCount: 0, unfilledVariables: [] };
  }

  const unfilledSet = new Set<string>();
  let replacedCount = 0;

  const renderedText = content.replace(
    new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g"),
    (_fullMatch, rawName: string, rawDefault?: string) => {
      const trimmedName = rawName.trim();
      const normalizedKey = trimmedName.toLowerCase();
      const trimmedDefault = rawDefault !== undefined ? rawDefault.trim() : undefined;

      const userVal = values[trimmedName] !== undefined 
        ? values[trimmedName] 
        : values[normalizedKey];

      if (userVal !== undefined && userVal !== "") {
        replacedCount++;
        return userVal;
      }

      if (trimmedDefault !== undefined && trimmedDefault !== "") {
        replacedCount++;
        return trimmedDefault;
      }

      unfilledSet.add(trimmedName);
      return _fullMatch; // Keep placeholder if no value or default provided
    }
  );

  return {
    renderedText,
    replacedCount,
    unfilledVariables: Array.from(unfilledSet),
  };
}

/**
 * Validate that all required variables have input or defaults
 */
export function validateTemplateInputs(
  variables: TemplateVariable[],
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const v of variables) {
    const val = values[v.name] ?? values[v.rawKey];
    const hasValue = val !== undefined && val.trim().length > 0;
    const hasDefault = v.defaultValue !== undefined && v.defaultValue.trim().length > 0;

    if (!hasValue && !hasDefault) {
      missing.push(v.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
