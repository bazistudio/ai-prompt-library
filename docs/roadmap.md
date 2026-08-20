# Development Roadmap

This roadmap outlines the incremental phases of development for the AI Prompt Library, leading to the full web-first and Electron-packaged release.

## Phase 1 — Foundation (Completed)
- [x] Next.js 16 app router setup & type configuration
- [x] Tailwind CSS v4 CSS-first theme variables setup
- [x] Client-side Theme Provider (Dark/Light toggle, local storage sync, no-reload)
- [x] Server-side MongoDB connection integration
- [x] JWT Session Authentication handler (`jose` + HTTP-only cookies)
- [x] Route proxy redirection guard (`src/proxy.ts`)
- [x] Local storage DB preparation (`better-sqlite3` isolated helper)
- [x] Responsive layout Application Shell (Sticky sidebar, top navbar, mobile side drawer)

---

## Phase 2 — Prompt Library (In Progress)
- [ ] **Prompt model & schemas**: Define Prompt, Tag, and Category schemas.
- [ ] **Prompt CRUD Endpoints**: REST API endpoints for prompts.
- [ ] **Category Manager**: Create, list, edit, and delete user-defined categories.
- [ ] **Tag Selector**: Add tags dynamically to prompt cards.
- [ ] **Search & Filters**: Basic keyword prompt search and category filtering.
- [ ] **Prompt Viewer & Editor**: Interactive markdown editor and viewer for prompt text.
- [ ] **Favorites**: Toggle prompt bookmark status.

---

## Phase 3 — Prompt Engineering (Planned)
- [ ] **Prompt Versioning**: Track edit history and support prompt rolls/reverts.
- [ ] **Master Prompts**: Lock central base prompts for derivative prompts.
- [ ] **Prompt Templates**: Insert double-bracket variables (e.g. `{{user_name}}`) into prompts.
- [ ] **Variable Editor**: Detect placeholders dynamically and prompt users for test values.
- [ ] **Prompt Testing**: Connect simple API runners to test prompting outputs.
- [ ] **Workflows**: Sequence prompts sequentially (Prompt A output feeds into Prompt B).

---

## Phase 4 — Productivity (Planned)
- [ ] **Projects**: Group prompts into logical multi-user projects.
- [ ] **History Logs**: Audit prompt executions and edits.
- [ ] **Advanced Filter Queries**: Search prompts by tags, categories, version counts, and dates.
- [ ] **Metrics Dashboard**: Detail usage counts, favorite highlights, and categories breakdown.

---

## Phase 5 — Desktop Application (Completed)
- [x] **Electron Container**: Package the Next.js app in an Electron window.
- [x] **Local Storage Driver**: Activate the SQLite local storage backend.
- [x] **Offline Mode & Relocation**: Support local storage configuration, directory migration, and direct raw file explorer access.
- [x] **Database Maintenance**: Real-time SQLite storage stats, VACUUM space reclamation, and `.db` snapshot download.
- [x] **Command Palette & Cheatsheet**: Global spotlight command palette (`⌘K`) and shortcuts cheatsheet (`?`).

---

## Phase 6 — AI Integrations (Completed)
- [x] **Multi-LLM Execution Subsystem**: Server-side proxy handling Google Gemini (`@google/genai`), OpenAI GPT, Anthropic Claude, and Local Ollama.
- [x] **Live AI Playground**: Interactive multi-model test runner with parameter tuning (temperature, max tokens), live output preview, and direct "Save as Version" capability.
- [x] **AI Prompt Enhancer**: Automated prompt refinement with Gemini (clarity & structure, template variable injection, system instruction conversion, reasoning optimization).
- [x] **AI Provider Settings**: Dedicated settings tab with API key managers, local endpoint configuration, and live connection health diagnostics.
- [x] **Audit Telemetry**: Non-blocking audit logging for AI execution latency, tokens, and model performance.

---

## Phase 7 — Workflows & Multi-Model Arena (Completed)
- [x] **Prompt Workflows & Sequential Chains**: Interactive studio for building and running multi-step AI pipelines (`/workflows`).
- [x] **Step-to-Step Output Piping**: Automated context passing across chain stages (e.g. `{{step_1.output}}` feeding into Step 2).
- [x] **Model Comparison Arena**: Real-time side-by-side benchmark runner comparing up to 4 models simultaneously (`/arena`).
- [x] **Benchmarking Telemetry**: Latency tracking (fastest model badge), token usage estimation, winner voting, and result export.
- [x] **Global Command Integration**: Quick navigation shortcuts and palette actions for workflow studio and comparison arena.

