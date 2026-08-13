# System Architecture

This document describes the software architecture of the AI Prompt Library, explaining how the Next.js frontend, authentication handlers, and hybrid data-store layers interact.

## Hybrid Data Stores

The application is structured to support two different database backends:

```text
                  AI Prompt Library Core
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         Online Storage            Local Storage
         (MongoDB Atlas)          (SQLite File)
               │                         │
     Primary development source      Prepared for
       for Next.js web application  Electron desktop shell
```

### 1. Cloud Prompt Storage (MongoDB)
- **Status**: **Active development data store**.
- **Driver**: Mongoose ORM.
- **Role**: Securely stores users, categories, tags, prompts, versions, and projects.
- **Connection**: Managed via connection pooling in `src/lib/mongodb/`.

### 2. Offline Local Storage (SQLite)
- **Status**: **Prepared for future Phase 5 (Electron release)**.
- **Driver**: `better-sqlite3`.
- **Role**: Will function as the desktop file-system storage database when packaged in Electron.
- **Connection**: Managed via isolated connection helpers in `src/lib/sqlite/`.

---

## Authentication & Route Protection

The library implements a stateless, secure authentication flow at the routing layer:

```text
Request Path
   │
   ▼
[Path Proxy Guard] (src/proxy.ts)
   │
   ├── Token missing/invalid? ──► Redirect /login
   │
   └── Decrypt JWT token (jose) 
         │
         ▼
Extract Session Data ──► Inject User context ──► Route to Dashboard
```

1. **Password Hashing**: Done server-side using `bcryptjs` during registration and login.
2. **Session Signature**: Signed JWTs are issued via `jose` and stored in secure, HTTP-only client cookies (`SESSION_COOKIE_NAME`).
3. **Route Protection**: The Next.js 16 route proxy guard at `src/proxy.ts` evaluates all requests against incoming session cookies. If a session is valid, auth routes redirect to `/dashboard`. If invalid, protected dashboard routes redirect to `/login`.

---

## Folder Structure Mapping

- `src/app/`: App router pages, route groups (`(auth)` and `(dashboard)`), and API route endpoints.
- `src/components/`: Reusable react UI widgets (under `ui/`) and shell wrappers (under `layout/`).
- `src/lib/`: Database connectors, cryptographic session signs, validation schemas, and format utils.
- `src/models/`: Mongoose schemas for MongoDB document mapping.
- `src/config/`: System environment loaders and typing definitions.
- `src/proxy.ts`: Next.js 16 path proxy route guard middleware.
