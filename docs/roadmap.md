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

## Phase 5 — Desktop Application (Planned)
- [ ] **Electron Container**: Package the Next.js app in an Electron window.
- [ ] **Local Storage Driver**: Activate the SQLite local storage backend.
- [ ] **Offline Mode Toggle**: Support "Save Online" (MongoDB) vs "Save Locally" (SQLite) settings.
- [ ] **Bidirectional Synchronization**: Sync offline local prompts to MongoDB when internet reconnects.

---

## Phase 6 — AI Integrations (Planned)
- [ ] OpenAI GPT integrations.
- [ ] Google Gemini API integrations.
- [ ] Anthropic Claude API integrations.
- [ ] Local model (Ollama) endpoints testing.
