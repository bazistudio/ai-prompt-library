# Development Rules

This document outlines the core coding standards, safety boundaries, and validation procedures required when contributing to the AI Prompt Library.

## 🧱 Architectural Principles

1. **Incremental Complexity**: Do not add state management libraries (Zustand, Redux) or advanced databases (Prisma, PostgreSQL, Supabase) unless specifically required and approved. Keep layout wrappers stateless and client components limited.
2. **Component Reusability**: Do not over-engineer components. Re-use existing UI primitives (`Button`, `Input`) rather than installing external ui frameworks (like Radix/Shadcn) unless requested.
3. **Database Separation**:
   - **Active Web Database**: Always use **MongoDB** via Mongoose for active prompt features, users, schemas, and metrics.
   - **Electron Desktop Database**: **SQLite** is prepared for local desktop use cases in Electron. Keep the sqlite handler isolated; do not mix it with active web database routes.

---

## 🎨 Theme & Color Constraints

- **No Hardcoded Hex Colors**: Hex codes like `#1A016F`, `#030712`, `#FCF4FF` or hardcoded Tailwind colors like `bg-zinc-900`, `text-violet-600`, or `border-white/5` must **never** be used in component class names.
- **Always Use Theme Tokens**: Style components using `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, etc.
- **Theme-Independent Elements**: Ensure elements display correctly when toggling dark and light modes. Test contrast ratios in both themes.

---

## 🔒 Security & Git Safety

- **Never Commit Credentials**: Credentials, session secrets, API tokens, database paths, and local databases must never be committed to version control.
- **Strict Gitignore Checks**: Ensure the following entries are kept in `.gitignore` and never committed:
  - `.env` and `.env.local`
  - Database files (`*.db`, `*.db-shm`, `*.db-wal`)
  - Build files (`.next/`, `node_modules/`, `dist/`)

---

## 🧪 Pre-Commit Verification Workflow

Before committing code or submitting pull requests, developers must run the following verification commands to ensure codebase integrity:

```bash
# 1. Type Safety Check
npx tsc --noEmit

# 2. Linting Audits (must exit with code 0)
npm run lint

# 3. Production Compilation Build (Turbopack)
npm run build
```
Any linting errors or compilation warnings must be resolved before pushing the branch.
