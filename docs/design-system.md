# Design System

This guide outlines the centralized color tokens, font configurations, theme modifiers, and custom UI utility classes used in the AI Prompt Library.

## CSS-First Theme Integration (Tailwind v4)

Tailwind CSS v4 is configured to read theme tokens directly from custom properties. In `globals.css`, these properties are mapped in the `@theme` directive, utilizing underlying runtime values to support no-reload theme toggling.

```text
CSS Variable mapping flow:

 Tailwind Class (bg-primary)
      │
      ▼
 CSS Property (--color-primary)
      │
      ▼
 Runtime Value Variable (--color-primary-value)
      │
      ├─► Default (Dark mode): #1a016f
      │
      └─► Override (.light class): #1a016f
```

---

## Centralized Colors & Semantic Mapping

All components must remain theme-independent. Hardcoded colors must not be used in JSX elements. Instead, use these semantic color utilities:

| Utility Name | Dark Theme Value (Default) | Light Theme Value (`.light`) | Description |
| :--- | :--- | :--- | :--- |
| `bg-background` | `#0b0620` (Dark violet-blue) | `#fcf4ff` (Light lilac) | Root body background |
| `text-foreground` | `#fcf4ff` (Off-white) | `#1a016f` (Dark violet) | Primary text color |
| `bg-card` | `#130a2d` (Deep violet-gray) | `#ffffff` (White) | Cards and panels |
| `bg-primary` | `#1a016f` (Brand Violet) | `#1a016f` (Brand Violet) | Main primary actions |
| `text-primary` | `#1a016f` | `#1a016f` | Used for links in light mode |
| `bg-accent` | `#c5ffe5` (Mint green) | `#c5ffe5` (Mint green) | Highlights and success states |
| `border-border` | `#30234d` | `#ded2e5` | Divider and component borders |
| `bg-muted` | `#21163d` | `#eee4f4` | Secondary states, input disables |

---

## Typography

The application imports and configures two fonts via `next/font/google` in `layout.tsx`:

1. **sans-serif** (Inter): Used for interface buttons, body text, tags, and structure.
   - Variable: `--font-inter`
   - Configured in theme as `font-sans` (`var(--font-inter), Inter, sans-serif`)
2. **monospace** (Geist Mono): Used for code highlights, prompts, variable parameters, and config details.
   - Variable: `--font-geist-mono`
   - Configured in theme as `font-mono` (`var(--font-geist-mono), "Geist Mono", monospace`)

---

## Custom Layout Classes

To keep styling elegant and unified, these custom compound classes are defined at the root stylesheet:

### 1. `.glass-card`
Provides a frosted semi-transparent backdrop using card background tokens.
- **Properties**: `background: color-mix(in srgb, var(--color-card) 75%, transparent)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--color-border)`.

### 2. `.glass-card-glow`
A glass-card container that casts a primary shadow and subtle ambient color glow.
- **Properties**: Includes `.glass-card` properties + `box-shadow` values mapped to `--shadow-card` and primary color values.

### 3. `.brand-text-gradient`
Applies a text gradient for headers.
- **Colors (Dark)**: Gradients from `--color-foreground` (off-white) to `--color-accent` (mint).
- **Colors (Light)**: Gradients from `--color-foreground` (dark violet) to `--color-primary-hover` (indigo).
