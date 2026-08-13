# AI Prompt Library

> A personal AI prompt engineering workspace for creating, organizing, testing, versioning, and managing reusable AI prompts.

AI Prompt Library is a developer-focused application designed to become a centralized workspace for storing and managing hundreds or thousands of AI prompts.

The project is being built with a web-first architecture using Next.js and MongoDB, with a future Electron desktop application providing local SQLite storage.

---

## 🚧 Project Status

**Development — Foundation Phase**

The project is currently being developed incrementally.

Current focus:

- Application foundation
- Authentication
- Global design system
- Theme customization
- Settings
- Responsive application shell
- MongoDB development storage
- SQLite preparation for future Electron support

The full prompt management system will be implemented in subsequent phases.

---

## ✨ Vision

The goal is to build a powerful personal prompt library where developers, designers, marketers, business owners, and AI users can organize their growing collection of prompts in one place.

The long-term application will support:

- Thousands of prompts
- Categories
- Tags
- Prompt templates
- Variables
- Prompt versions
- Master prompts
- Projects
- Workflows
- Prompt testing
- Search
- Filtering
- Favorites
- Prompt history
- Online storage
- Local desktop storage
- Local ↔ Online synchronization

---

## 🧠 Core Concept

The application is designed around a simple idea:

```text
Create
   ↓
Organize
   ↓
Test
   ↓
Improve
   ↓
Version
   ↓
Reuse
```

Instead of keeping prompts scattered across:

- Text files
- Notes applications
- Browser bookmarks
- Chat histories
- Documents
- Messaging applications

AI Prompt Library provides one dedicated workspace.

---

## 🏗️ Architecture

### Current Web Application
```text
┌─────────────────────────────────────────────┐
│                Next.js 16                   │
│                                             │
│  React + TypeScript + Tailwind CSS          │
│                                             │
│  App Router + Route Handlers                │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
             ┌─────────────┐
             │   MongoDB   │
             │             │
             │ Development │
             │ Data Store  │
             └─────────────┘
```

### Future Electron Application
```text
                 AI Prompt Library
                         │
              ┌──────────┴──────────┐
              │                     │
         Save Online           Save Locally
              │                     │
              ▼                     ▼
          MongoDB                SQLite
              │                     │
              └──────────┬──────────┘
                         │
                  Future Sync
```

### Important Storage Decision
During the current Next.js development phase:
- **MongoDB** is the active data source. Prompt data, categories, tags, versions, templates, projects, and other application data will be developed and tested using MongoDB.
- **SQLite** is currently prepared as a future local-storage provider for the Electron desktop application.
- The application does not currently switch between MongoDB and SQLite.

---

## 🛠️ Technology Stack

### Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- App Router

### Backend
Next.js internal server-side functionality:
- Route Handlers
- Server Components
- Server-side utilities

No separate Express backend is used.

### Database
- MongoDB (Mongoose)

### Future Local Database
- SQLite (`better-sqlite3`)
- Electron

### Authentication
- `bcryptjs`
- `jose` (JWT)
- HTTP-only session cookies
- Zod validation

### UI
- Tailwind CSS
- Lucide React
- Custom semantic design system

---

## 🎨 Design System

The application uses a centralized semantic color system.

### Default Brand Colors
- **Primary**: `#1A016F`
- **Light**: `#FCF4FF`
- **Accent**: `#C5FFE5`

The design system is intentionally theme-driven. Components should never depend on hardcoded colors. Instead, components use semantic Tailwind color utilities such as:

- `bg-primary` / `text-primary-foreground`
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-secondary` / `text-muted-foreground`
- `border-border` / `bg-accent`

This allows the complete application theme to change from Settings without rewriting individual components.

---

## 🎨 Theme Customization

The application supports user customization through:
- Dark theme
- Light theme
- System theme (planned)
- Accent color selection (planned)
- Custom accent color (planned)
- Reduced motion preferences

The default theme is based on the project's primary brand palette. Future versions will provide additional customization options.

---

## 🧭 Application Navigation

The application intentionally keeps navigation minimal.

### Navbar
- Logo & AI Prompt Library Title
- Prompt Home
- Global Search (placeholder)
- Theme Toggler (Dark / Light)
- Profile Icon & User Details
- Logout Button

### Sidebar
- **PROMPT CATEGORIES** (Empty state placeholder + **+ Add Category** button)
- **Settings** (aligned to bottom)
- **Docs** (aligned to bottom)

Categories will be user-created rather than hardcoded navigation pages. This allows the library to scale to hundreds of categories without modifying the navigation structure.

---

## 📚 Planned Prompt Library

The future prompt system will support:
- **Prompts**: Create, Edit, View, Delete, Duplicate, Favorite, Archive
- **Organization**: Categories, Tags, Projects, Filters, Search
- **Prompt Engineering**: Variables, Templates, Master prompts, Prompt versions, Prompt testing, Workflows
- **Productivity**: Copy prompt, Quick search, Recently used, Favorites, History

---

## ⚙️ Settings

The Settings system will eventually contain:
- Appearance
- Prompt Editor
- Library
- Account
- Storage
- About

### Appearance customization will include:
- Theme selection
- Accent color
- Custom colors
- Reduced motion
- Interface preferences

### Prompt Editor settings will eventually include:
- Editor font
- Font size
- Word wrapping
- Line numbers
- Auto-save
- Editor width

### Library settings will eventually include:
- Default view
- Default sorting
- Prompt preview
- Tags visibility
- Delete confirmation

---

## 🔐 Security

Security is a core requirement of the project. The application will:
- Never store plaintext passwords
- Hash passwords using `bcryptjs`
- Keep authentication secrets server-side
- Use HTTP-only cookies for sessions
- Validate authentication input with Zod
- Keep MongoDB credentials server-side
- Never expose password hashes to clients
- Never expose JWT secrets through `NEXT_PUBLIC_*` variables
- Keep local database files out of Git

---

## 📁 Project Structure

The project follows a modular Next.js architecture.

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── LogoutButton.tsx
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SidebarCategory.tsx
│   │   ├── SidebarFooter.tsx
│   │   └── MobileSidebar.tsx
│   └── theme/
│       └── ThemeProvider.tsx
│
├── lib/
│   ├── mongodb/
│   ├── sqlite/
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── session.ts
│   ├── validation/
│   └── utils/
│
├── models/
│
├── types/
│
├── config/
│
└── proxy.ts
```

The structure may evolve as new modules are introduced.

---

## 🚀 Getting Started

### Requirements
Install:
- Node.js
- npm
- MongoDB / MongoDB Atlas

### Clone
```bash
git clone <repository-url>
cd ai-prompt-library
```

### Install dependencies
```bash
npm install
```

### Environment Variables
Create `.env.local` in the root:
```ini
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_session_secret
NEXT_PUBLIC_APP_NAME="AI Prompt Library"
SQLITE_DB_PATH=./prompt-library.db
```
*Never commit `.env.local` to git.*

### ▶️ Development
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🧪 Verification
Before committing changes:
```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation
- [x] Next.js 16 foundation
- [x] TypeScript Configuration
- [x] Tailwind CSS v4 CSS-first configuration
- [x] MongoDB connection validation
- [x] Authentication foundation (JOSE JWT + HTTP-only cookies)
- [x] SQLite connection preparation (`better-sqlite3`)
- [x] Global responsive application shell
- [x] Settings UI structure preparation
- [x] Dark/Light Theme toggling system (no-reload)

### Phase 2 — Prompt Library
- [ ] Prompt CRUD
- [ ] Prompt editor
- [ ] Prompt viewer
- [ ] Categories
- [ ] Tags
- [ ] Search
- [ ] Filters
- [ ] Favorites

### Phase 3 — Prompt Engineering
- [ ] Prompt versions
- [ ] Master prompts
- [ ] Templates
- [ ] Variables
- [ ] Prompt testing
- [ ] Workflows

### Phase 4 — Productivity
- [ ] Projects
- [ ] History
- [ ] Advanced search
- [ ] Usage statistics
- [ ] Analytics

### Phase 5 — Desktop Application
- [ ] Electron application bundling
- [ ] SQLite local storage implementation
- [ ] Save Locally vs Save Online switching
- [ ] Local ↔ Online synchronization
- [ ] Offline-first workflows

### Phase 6 — AI Integrations
- [ ] OpenAI API Integration
- [ ] Google Gemini API Integration
- [ ] Anthropic Claude API Integration
- [ ] Other AI providers

---

## 🧱 Development Principles

- **Keep the architecture simple**: Avoid unnecessary dependencies and infrastructure.
- **Reuse existing components**: Create reusable components only when they provide genuine value.
- **Centralize design tokens**: Do not hardcode colors throughout the application.
- **Keep storage abstraction ready**: MongoDB is the current active data source. SQLite is reserved for future Electron local-only execution.
- **Build incrementally**: Each major feature should be implemented, tested, and stabilized before moving to the next feature.
- **Avoid premature complexity**: Do not introduce state managers (Redux, Zustand) or relational mapping (Prisma, PostgreSQL) unless a future requirement genuinely justifies it.

---

## 🔒 Repository Safety

The repository must never contain:
- `.env`
- `.env.local`
- `*.db`
- `*.db-shm`
- `*.db-wal`
- `node_modules`
- `.next`

Secrets, database credentials, session secrets, and local databases must remain outside version control.

---

## 📌 Current Development Direction

The immediate goal is not to build every feature at once. The current priority is:

```text
Stable Foundation
       ↓
Application Shell
       ↓
Settings & Theme System
       ↓
Prompt Library
       ↓
Prompt Engineering Tools
       ↓
Electron Desktop
       ↓
Local + Online Storage
       ↓
Synchronization
       ↓
AI Integrations
```

---

## 📄 Documentation

Project documentation is maintained alongside the source code:
- **[`AGENTS.md`](file:///e:/library/prompt-library/AGENTS.md)**: Agent rules and boundaries for AI coders.
- **[`docs/architecture.md`](file:///e:/library/prompt-library/docs/architecture.md)**: Details of the Next.js, MongoDB, and SQLite setup.
- **[`docs/design-system.md`](file:///e:/library/prompt-library/docs/design-system.md)**: Guide to theme colors, fonts, and responsive components.
- **[`docs/development-rules.md`](file:///e:/library/prompt-library/docs/development-rules.md)**: Style guides, coding standards, and safety limits.
- **[`docs/roadmap.md`](file:///e:/library/prompt-library/docs/roadmap.md)**: Phase tracking and incremental feature breakdowns.

---

## 📜 License

License information will be added before the project is publicly released.

---

## 👨‍💻 Project

**AI Prompt Library**

A personal prompt engineering workspace built for long-term AI-assisted development and productivity. Built incrementally. Designed for thousands of prompts. Prepared for web and desktop.
