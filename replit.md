# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: JWT (bcryptjs + jsonwebtoken)

## Project: NOOR AI

A high-end AI-powered educational platform with:
- Smart YouTube video player with AI Tutor checkpoints (Pause & Interact)
- Student Dashboard with learning progress and streaks
- Future Simulator: career roadmap generator
- Subscription wall ($5/month) with NOWPayments USDT/Crypto placeholder
- Admin panel for managing videos and AI checkpoints
- PWA with service worker (install on mobile)
- Local Processing privacy disclaimer

### Default Accounts (password: `password`)
- Admin: `admin@noorai.com`
- Student (subscribed): `ahmed@student.com`
- Student (free): `sara@student.com`

### Color Palette
- Primary: Sky Blue (#0ea5e9)
- Background: White
- Secondary: Light Grey

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (auth, videos, chat, career, subscription, progress, dashboard)
│   └── noor-ai/            # React + Vite frontend (all pages)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts
│           ├── videos.ts
│           ├── checkpoints.ts
│           ├── progress.ts
│           └── subscriptions.ts
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — cross-package imports use project references

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with all NOOR AI endpoints.

Routes:
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `GET /api/videos` — List videos (filter by subject/grade)
- `POST /api/videos` — Create video (admin)
- `GET /api/videos/:id` — Get video
- `GET /api/videos/:id/checkpoints` — Get AI checkpoints
- `POST /api/videos/:id/checkpoints` — Add checkpoint (admin)
- `POST /api/chat` — AI Tutor chat
- `POST /api/career/roadmap` — Generate career roadmap
- `GET /api/subscription/status` — Subscription status
- `POST /api/subscription/create` — Create crypto/card subscription
- `GET /api/progress` — Student progress
- `POST /api/progress` — Record progress
- `GET /api/dashboard/summary` — Student dashboard
- `GET /api/dashboard/admin` — Admin dashboard

### `artifacts/noor-ai` (`@workspace/noor-ai`)

React + Vite frontend (PWA). Pages:
- `/` — Landing page
- `/login`, `/register` — Auth
- `/dashboard` — Student dashboard
- `/videos` — Video library
- `/videos/:id` — Smart video player with AI Tutor
- `/future` — Career roadmap simulator
- `/subscribe` — Subscription wall
- `/admin` — Admin panel

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

Production migrations are handled by Replit when publishing. In development, use `pnpm --filter @workspace/db run push`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec for NOOR AI. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` / `lib/api-client-react`

Generated from OpenAPI spec via Orval.
