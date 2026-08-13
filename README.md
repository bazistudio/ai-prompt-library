# AI Prompt Library

A personal, offline-first AI prompt management application built with Next.js and prepared for hybrid cloud/local desktop packaging.

---

## Project Purpose
To provide a secure, developer-focused, and highly performant workspace to organize, version, test, and optimize AI prompt engineering workflows.

---

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **UI Core**: React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Primary Web Database**: MongoDB (Mongoose)
- **Offline / Local Database**: SQLite (better-sqlite3)
- **Authentication**: jose (JWT), bcryptjs (Password Hashing)
- **Validation**: Zod

---

## Storage Architecture
The project is built on a hybrid architecture designed to easily transition between web and offline desktop environments:

```
                    AI Prompt Library
                           │
                    Next.js / Electron
                           │
              ┌────────────┴────────────┐
              │                         │
         ☁️ Online Mode             💻 Local Mode
              │                         │
           MongoDB                    SQLite
              │                         │
       Cloud Prompt Data          PC Prompt Data
```

### MongoDB Purpose
MongoDB is the primary active data store for the entire web application during development and testing. It stores:
- User accounts and authentication details
- Prompts, categories, tags, projects, and version histories
- Templates, variables, workflows, and tests

### SQLite Purpose
SQLite is integrated and isolated to act as the prompt database provider when compiled into an Electron desktop application. In the current web boilerplate:
- The SQLite connection layer is initialized at startup.
- No prompt schemas are bound to SQLite yet, keeping it isolated for the future desktop wrap.
- There is no switching or synchronization implemented in this phase.

---

## Folder Structure
```
src/
├── app/
│   ├── (auth)/             # Auth layouts and pages (/login, /register)
│   ├── (dashboard)/        # Dashboard workspace (/dashboard)
│   ├── api/
│   │   └── auth/           # Route Handlers for auth endpoints
│   ├── globals.css         # Custom dark theme and design systems
│   ├── layout.tsx          # Root Layout config
│   └── page.tsx            # Visual-heavy landing page
│
├── components/
│   ├── layout/             # Shared layout subcomponents
│   └── ui/                 # Reusable ui elements (e.g. LogoutButton)
│
├── config/
│   └── env.ts              # Zod validation schema for process.env at startup
│
├── lib/
│   ├── auth/               # jwt.ts (jose), session.ts (cookie manager)
│   ├── mongodb/            # db.ts (Mongoose client setup)
│   ├── sqlite/             # db.ts (better-sqlite3 client setup)
│   └── validation/         # Zod schema schemas for auth inputs
│
├── models/
│   └── User.ts             # Mongoose User database model
│
└── types/                  # Shared typings
```

---

## Environment Variables
Create a `.env.local` file in the root directory. Template is available in `.env.example`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/ai-prompt-library

# JWT Secret (Min 32 characters)
JWT_SECRET=your-secret-key-at-least-32-characters

# App metadata
NEXT_PUBLIC_APP_NAME=AI Prompt Library

# SQLite file path
SQLITE_DB_PATH=./prompt-library.db
```

---

## Development Commands
- Run local development server:
  ```bash
  npm run dev
  ```
- Build production compilation bundle:
  ```bash
  npm run build
  ```
- Run ESLint rules:
  ```bash
  npm run lint
  ```

---

## Authentication Flow
1. **Zod Validation**: Registration and login inputs are sanitized client-side and validated server-side.
2. **Password Cryptography**: Passwords are saved hashed with `bcryptjs` and are never exposed in response objects.
3. **Session Cookies**: Session payloads are signed via `jose` into a JWT, placed inside an HTTP-only secure cookie, and checked by Next.js 16 route `proxy.ts`.
4. **Proxy Redirection**: Protected `/dashboard` routes automatically redirect to `/login` if no session is active. Active sessions redirect from `/login` or `/register` directly to `/dashboard`.
