# Architecture

This document describes the system architecture, component interactions, and design decisions for Dragonvite.

## System Overview

Dragonvite is a production-ready monorepo with:

- **Frontend**: React + Vite SPA served via Nginx
- **Backend**: Fastify REST API + Socket.io real-time
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis + BullMQ for async jobs
- **Infrastructure**: Docker Compose locally, Oracle Cloud for production

## High-Level Architecture

```
┌────────────────────────────────────────────────┐
│              Frontend (React + Vite)           │
│  ┌──────────────────────────────────────────┐  │
│  │ TanStack Query (server state caching)    │  │
│  │ Zustand + Immer (client state)           │  │
│  │ Socket.io Client (real-time updates)     │  │
│  │ React Konva (canvas/map rendering)       │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────┘
                 │ HTTP + WebSocket
                 ▼
      ┌──────────────────────┐
      │  Nginx Reverse Proxy │
      │  ├─ Static files     │
      │  └─ Route /api & WS  │
      └──────────┬───────────┘
                 │
    ┌────────────┴─────────────┐
    │                          │
    ▼                          ▼
┌─────────────────┐    ┌──────────────────┐
│ Fastify Backend │    │ Socket.io Server │
│ REST API        │    │ Real-time events │
└────────┬────────┘    └────────┬─────────┘
         │                      │
    ┌────┴──────┬───────────────┘
    │           │
    ▼           ▼
┌──────────┐  ┌──────────┐
│ Supabase │  │  Redis   │
│ Database │  │ & BullMQ │
└──────────┘  └──────────┘
```

## Component Interactions

### 1. Real-Time Game Update (Player Movement)

```
Player moves on canvas
    │
    ├─ Zustand updates UI optimistically
    │
    ├─ Socket.io emit: { entityId, x, y }
    │
    ▼ (over WebSocket)
Backend receives move event
    │
    ├─ Validate move with Zod
    ├─ Check game rules (can move there?)
    ├─ Save to Supabase
    │
    ▼
Broadcast to all connected clients
    │
    ├─ Other players' clients receive update
    ├─ TanStack Query re-syncs state
    ├─ Canvas re-renders with new position
    │
    ▼
Game state consistent across all clients
```

### 2. Background Job (Email, LLM, etc.)

```
User completes task
    │
    ├─ Backend API endpoint called
    │
    ├─ Queue job in Redis via BullMQ
    │   (e.g., "sendEmail" job)
    │
    ▼ (async, non-blocking)
Respond to client immediately: { status: 'queued' }
    │
    │ Meanwhile...
    │
    ▼
BullMQ worker picks up job from queue
    │
    ├─ Call external API (Resend for email, Ollama for LLM)
    ├─ Save result to database
    ├─ Optionally emit Socket.io event to client
    │
    ▼
Emit event: 'job:completed' { result }
    │
    ├─ Frontend listens via Socket.io
    ├─ Update UI with result
    │
    ▼
User sees final result
```

### 3. Data Synchronization

**Server State (TanStack Query + Database):**

```
GET /api/users/me
    │
    ├─ TanStack Query caches response
    ├─ Auto-revalidate on interval or event
    ├─ Stale-while-revalidate pattern
    │
    ▼
Consistent server data across components
```

**Client State (Zustand):**

```
UI selection, form inputs, transient flags
    │
    ├─ Stored in Zustand + Immer
    ├─ Non-persisted (lost on page reload)
    ├─ Only user-specific, not shared
    │
    ▼
Fast, responsive UI updates
```

## Package Structure

### `apps/frontend`

**Vite + React + TypeScript**

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component with routing
├── components/           # Reusable UI components
│   ├── Navbar.tsx
│   ├── GameCanvas.tsx
│   └── ...
├── pages/                # Page-level components
│   ├── HomePage.tsx
│   ├── GamePage.tsx
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useSocket.ts      # Socket.io connection
│   ├── useGameState.ts   # Game state management
│   └── ...
├── store/                # Zustand stores
│   ├── appStore.ts       # App-wide state
│   ├── gameStore.ts      # Game state
│   └── ...
├── utils/                # Utilities
│   ├── api.ts            # API client
│   └── ...
├── types/                # TypeScript types
└── config/               # Configuration
    ├── index.ts
    └── theme.ts          # MUI theme
```

**Key Dependencies:**

- `react`: UI framework
- `vite`: Build tool
- `@tanstack/react-query`: Server state
- `zustand`: Client state
- `socket.io-client`: WebSocket client
- `react-konva`: Canvas rendering
- `@mui/material`: UI components

### `apps/backend`

**Fastify + TypeScript**

```
src/
├── server.ts             # Fastify app setup
├── config/               # Configuration
│   └── index.ts
├── routes/               # API route modules
│   ├── users.ts
│   ├── games.ts
│   └── ...
├── services/             # Business logic
│   ├── userService.ts
│   ├── gameService.ts
│   └── ...
├── jobs/                 # BullMQ job workers
│   ├── sendEmailJob.ts
│   ├── generateContentJob.ts
│   └── ...
├── middlewares/          # Custom middlewares
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── ...
├── utils/                # Helper functions
└── types/                # TypeScript types
```

**Key Dependencies:**

- `fastify`: HTTP server
- `@fastify/websocket`: WebSocket support
- `socket.io`: Real-time events
- `prisma/@prisma/client`: Database ORM
- `zod`: Input validation
- `bullmq`: Job queue
- `redis`: Cache & queue storage
- `pino`: Logging

### `packages/shared`

**Shared Types, Constants, Utilities**

```
src/
├── types/                # Shared TypeScript types
│   └── index.ts
├── constants/            # App-wide constants
│   └── index.ts
├── utils/                # Shared utilities
│   └── index.ts
└── index.ts              # Main export
```

**Imported by:** Frontend + Backend

**Example types:**

```typescript
export type User = { id: string; email: string; name?: string };
export type GameEntity = { id: string; type: 'player' | 'npc'; x: number; y: number };
```

### `packages/database`

**Prisma Schema & Migrations**

```
prisma/
├── schema.prisma         # Data model
├── migrations/           # Migration files
│   ├── migration_lock.toml
│   └── *.sql
└── seed.js               # Database seeding
```

**Key Features:**

- Type-safe schema
- Auto-migrations via `pnpm db:migrate`
- Prisma Studio: `pnpm db:studio`

## Data Flow Patterns

### Request/Response (REST)

```
Frontend (TanStack Query)
    │
    ├─ GET /api/users/me
    │
    ▼
Backend (Fastify)
    │
    ├─ Validate input (Zod)
    ├─ Fetch from Supabase (Prisma)
    ├─ Transform response
    │
    ▼
Return JSON response
    │
    ├─ TanStack Query caches
    ├─ React re-renders
    │
    ▼
User sees data
```

### WebSocket (Real-Time)

```
Frontend (Socket.io Client)
    │
    ├─ Emit: 'game:move' { entityId, x, y }
    │
    ▼ (over WebSocket)
Backend (Socket.io Server)
    │
    ├─ Handle: 'game:move'
    ├─ Validate move
    ├─ Broadcast to room: 'game:state' updates
    │
    ▼
All connected clients receive update
    │
    ├─ Socket.io listener triggers
    ├─ Zustand updates state
    ├─ Canvas re-renders
    │
    ▼
All players see synchronized movement
```

### Background Job (Event-Driven)

```
Frontend API call
    │
    ├─ POST /api/game/complete-task
    │
    ▼
Backend
    │
    ├─ Queue job: new Job({ type: 'sendEmail', data: {...} })
    ├─ Save to Redis
    │
    ▼ (async)
Return: { status: 'queued', jobId }
    │
    │ Meanwhile...
    │
    ▼
BullMQ Worker
    │
    ├─ Pick up from queue
    ├─ Execute: send email via Resend API
    ├─ Update job status: 'completed'
    │
    ▼
Emit Socket.io event to client (optional)
    │
    ├─ Frontend listener catches event
    ├─ Update UI: "Email sent!"
    │
    ▼
User sees confirmation
```

## Technology Justifications

| Component              | Technology        | Rationale                                                   |
| ---------------------- | ----------------- | ----------------------------------------------------------- |
| **Frontend Build**     | Vite              | Instant HMR, fast production builds, better DX than CRA     |
| **Frontend Framework** | React 18          | Large ecosystem, component-driven, well-documented          |
| **Server State**       | TanStack Query    | Auto-sync, caching, deduplication, background refetch       |
| **Client State**       | Zustand           | Minimal boilerplate, Immer for immutable updates            |
| **Backend Server**     | Fastify           | Fast, plugin ecosystem, WebSocket support, TypeScript ready |
| **Real-Time**          | Socket.io         | Rooms/namespaces, fallbacks, auto-reconnect                 |
| **Database**           | Supabase + Prisma | Managed PostgreSQL, type-safe ORM, auto-migrations          |
| **Async Jobs**         | BullMQ + Redis    | Persistent queue, workers, retry logic, Bull Board UI       |
| **Validation**         | Zod               | Runtime type checking, TypeScript inference                 |
| **Monorepo**           | Turborepo + pnpm  | Task orchestration, caching, parallel builds                |
| **Containerization**   | Docker            | Consistent local/prod environments                          |
| **Reverse Proxy**      | Nginx             | Fast, lightweight, WebSocket support                        |
| **Code Quality**       | SonarQube         | Bugs, vulnerabilities, code smells detection                |

## Deployment Architecture

### Local Development

```
docker-compose up
    │
    ├─ Redis:6379
    ├─ Bull Board:3001
    ├─ Backend:3000 (internal)
    ├─ SonarQube:9000
    └─ Nginx:80 ← Frontend entry point
```

### Production (Oracle Cloud Always Free)

```
Oracle VM (2 vCPU, 4GB RAM, $0/month)
    │
    ├─ Docker Compose running same config
    ├─ Nginx serving frontend + proxying API
    ├─ Fastify backend
    ├─ Redis (in-memory cache + queue)
    │
    ├─ Database: Supabase PostgreSQL (external)
    ├─ Auth: Supabase Auth (external)
    ├─ Storage: Cloudflare R2 (external)
    ├─ Email: Resend API (external)
    ├─ Error Tracking: Sentry (external)
    │
    └─ Public IP: http://<oracle-ip>
```

**Deployment Flow:**

```
1. Engineer pushes to GitHub `main`
2. GitHub Actions build Docker image
3. SSH into Oracle VM
4. git pull latest code
5. docker-compose up -d
6. Services restart with new code
7. Public IP reflects changes
```

## Security Architecture

### HTTP Headers (Helmet)

```
Backend Response:
├─ Content-Security-Policy (block XSS)
├─ X-Frame-Options (prevent clickjacking)
├─ X-Content-Type-Options (prevent MIME sniffing)
├─ Strict-Transport-Security (force HTTPS)
└─ X-XSS-Protection (legacy XSS protection)
```

### CORS

```
Frontend requests to Backend:
├─ Origin: http://localhost
├─ Backend allows CORS_ORIGIN
├─ Credentials included if auth needed
└─ Preflight requests validated
```

### Rate Limiting

```
@fastify/rate-limit middleware:
├─ Per-IP request limit (default: 100 req/min)
├─ Tracks in Redis
├─ 429 Too Many Requests if exceeded
└─ Prevents brute force, DDoS
```

### Input Validation (Zod)

```
POST /api/users/me
├─ Parse body with Zod schema
├─ Validate types, formats, lengths
├─ Reject if invalid
└─ Proceed if valid
```

### Database Security

```
Prisma Queries:
├─ Parameterized queries (SQL injection prevention)
├─ Type-safe at compile time
├─ Row-level security in PostgreSQL (optional)
└─ Audit logging (optional)
```

## Scalability Considerations

### Current Setup (Always-Free Tier)

✅ Works well for:

- MVP / prototype
- Small team (<50 concurrent users)
- Low-traffic game
- Single VM sufficient

### Future Scaling

To handle more load:

1. **Database**: Supabase already manages this (vertical scaling automatic)
2. **Backend**: Add more instances behind load balancer
3. **Cache**: Redis cluster instead of single node
4. **Storage**: Cloudflare R2 for assets (CDN included)
5. **Frontend**: Already static files + CDN ready

**Scaling path:**

```
Current: 1 VM, 1 DB
    │
    ▼
2-3 VMs behind Nginx load balancer
    │
    ▼
Database replication (read replicas)
    │
    ▼
Kubernetes cluster (if needed)
```

## Monitoring & Observability

### Logs

**Backend (Pino):**

```typescript
logger.info({ userId: 123 }, 'User joined game');
logger.error({ error }, 'Database query failed');
```

Structured JSON logs for easy parsing.

### Error Tracking (Sentry)

```typescript
Sentry.captureException(error);
```

Tracks production errors with stack traces.

### Health Checks

```
Nginx checks: GET /health → 200
Backend responds: { status: 'ok', uptime: 123456 }
```

Used by orchestrators for auto-restart.

## Future Enhancements

- [ ] Load testing with k6
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Database query optimization
- [ ] WebSocket scaling (Socket.io Redis adapter)
- [ ] CDN integration (Cloudflare Workers)
- [ ] Feature flags (LaunchDarkly, Unleash)
- [ ] A/B testing infrastructure
- [ ] Mobile app (React Native)
