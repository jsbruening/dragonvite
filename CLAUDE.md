# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

Dragonvite is a pnpm + Turbo monorepo with this structure:

```
apps/frontend/    React 18 + Vite (game UI, MUI, Zustand, TanStack Query, React Konva, Socket.io)
apps/backend/     Fastify + TypeScript (REST API, Socket.io, BullMQ workers)
packages/database/ Prisma schema + migrations (targets Supabase PostgreSQL)
packages/shared/  Shared types, constants, utilities (consumed by both apps)
```

## Common Commands

All commands run from the repo root via Turbo unless working inside a specific package.

```bash
# Install deps
pnpm install

# Development (full stack via Docker Compose)
pnpm dev

# Build all packages
pnpm build

# Lint + format check
pnpm lint
pnpm format:check

# Type check
pnpm type-check

# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter @dragonvite/backend test
pnpm --filter @dragonvite/frontend test

# E2E (Playwright)
pnpm test:e2e

# Database
pnpm db:migrate    # create new migration
pnpm db:push       # sync schema to dev DB (no migration file)
pnpm db:studio     # open Prisma Studio
```

## Architecture

### Data Flow

- **REST**: Frontend → TanStack Query + Axios → `/api/*` → Fastify routes → Prisma → Supabase PostgreSQL
- **WebSocket**: Frontend Socket.io client ↔ Fastify Socket.io server (game moves, chat)
- **Async jobs**: Fastify enqueues to Redis → BullMQ workers process → emit completion via Socket.io

### Shared Package

`packages/shared` exports three entry points (`./types`, `./constants`, `./utils`). Both frontend and backend import from here. **Always add new shared types here** rather than duplicating across apps. The package must be built (`pnpm --filter @dragonvite/shared build`) before dependent apps can use it; Turbo handles this automatically.

### Frontend Path Aliases

The Vite config and `apps/frontend/tsconfig.json` define aliases: `@/*` → `src/*`, plus named aliases for `@components`, `@pages`, `@hooks`, `@store`, `@utils`, `@types`, `@config`.

### Backend Config

All env vars are validated at startup via Zod in `apps/backend/src/config.ts`. Required: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`. Optional: `RESEND_API_KEY`, `OLLAMA_API_URL`, `SENTRY_DSN`.

### Build Pipeline (Turbo)

Turbo task order: `type-check` → `build` → `test`. The `build` task depends on `^build` (upstream workspace deps build first). Run `pnpm build` from root to respect this order; running `tsc` directly inside a package may fail if `shared` hasn't been built yet.

## Infrastructure

Local dev and production use the same Docker Compose stack:
- **Nginx** (port 80): serves frontend static files, proxies `/api` and `/socket.io` to `backend:3000`
- **Backend** (port 3000): Fastify app
- **Redis** (port 6379): BullMQ queue + cache
- **Bull Board** (port 3001): job queue UI
- **SonarQube** (port 9000): code quality

Production target: Oracle Cloud Always Free VMs. Deploy is manual-only (`workflow_dispatch` in `.github/workflows/deploy.yml`) — SSH → git pull → docker compose up.

## CI/CD

GitHub Actions runs on PR and push to `main`:
- `lint.yml` — ESLint + Prettier check
- `test.yml` — Vitest (NODE_ENV=test)
- `build.yml` — Docker buildx (no push, validates build)
- `deploy.yml` — **Manual only**, deploys to Oracle Cloud via SSH
