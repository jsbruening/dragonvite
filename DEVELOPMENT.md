# Development Guide

This guide covers detailed setup, common workflows, and troubleshooting for Dragonvite development.

## Prerequisites

- Node.js >= 18.17.0 (install from https://nodejs.org)
- pnpm >= 8.0.0 (`npm install -g pnpm`)
- Docker Desktop (https://www.docker.com/products/docker-desktop)
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - Docker

## Initial Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd dragonvite
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local values:

```env
DATABASE_URL=postgresql://localhost/dragonvite
REDIS_URL=redis://localhost:6379
NODE_ENV=development
VITE_API_URL=http://localhost/api
VITE_WS_URL=http://localhost
```

### 3. Setup Doppler (Team-Recommended)

Doppler centralizes secrets management for the team:

```bash
# Install Doppler CLI
# macOS: brew install doppler
# Linux: curl -Ls https://cli.doppler.com/install.sh | sh
# Windows: choco install doppler

# Login with your Doppler account
doppler login

# Verify setup
doppler run -- env | grep DOPPLER
```

Then run commands with Doppler:

```bash
doppler run pnpm dev      # Injects secrets automatically
doppler run pnpm build
doppler run pnpm test
```

## Development Workflow

### Local Development with Docker Compose

The recommended workflow uses Docker Compose to run all services locally:

```bash
pnpm dev
```

This starts:

1. **Redis** (6379) – For caching and job queue
2. **Bull Board** (3001) – Visual job queue management
3. **Backend** (3000, internal) – Fastify API server
4. **SonarQube** (9000) – Code quality dashboard
5. **Nginx** (80) – Frontend & reverse proxy

**Access URLs:**

- Frontend: http://localhost
- API: http://localhost/api
- Bull Board: http://localhost:3001
- SonarQube: http://localhost:9000
- Backend health: http://localhost/health

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (reset data)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f redis
```

## Working with Packages

### Monorepo Structure

```
dragonvite/
├── apps/
│   ├── frontend/
│   └── backend/
└── packages/
    ├── shared/     # Shared types & utilities
    └── database/   # Prisma schema
```

### Running Commands in Specific Packages

```bash
# Run command in one package
pnpm --filter @dragonvite/frontend build

# Run in frontend app
pnpm --filter frontend dev

# Run in multiple packages
pnpm --filter ./packages/* type-check
```

### Adding Dependencies

```bash
# Add to specific package
pnpm --filter @dragonvite/frontend add react-router-dom
pnpm --filter @dragonvite/backend add express

# Add as dev dependency
pnpm --filter frontend add -D @types/react

# Add to root (shared dependencies)
pnpm add -w typescript prettier eslint
```

## Frontend Development

### Running Frontend Only

```bash
# Terminal 1:  Start Docker services (Redis, etc.)
docker-compose up redis

# Terminal 2: Run frontend dev server
pnpm --filter frontend dev
```

Frontend runs on http://localhost:5173 with Vite hot reload.

### Frontend File Structure

```
apps/frontend/src/
├── main.tsx           # Entry point
├── App.tsx            # Root component
├── components/        # Reusable UI components
├── pages/             # Page components
├── hooks/             # Custom React hooks
│   └── useSocket.ts   # Socket.io connection hook
├── store/             # Zustand state stores
├── utils/             # Utility functions
│   └── api.ts         # API client utilities
├── types/             # TypeScript type definitions
└── config/            # Configuration
    ├── index.ts       # App config
    └── theme.ts       # MUI theme
```

### Frontend Testing

```bash
# Run unit tests (Vitest)
pnpm --filter frontend test

# Watch mode
pnpm --filter frontend test -- --watch

# Coverage
pnpm --filter frontend test -- --coverage

# E2E tests (Playwright)
pnpm --filter frontend test:e2e

# Watch E2E tests
pnpm --filter frontend test:e2e -- --watch
```

## Backend Development

### Running Backend Only

```bash
# Terminal 1: Start Docker services (Redis, etc.)
docker-compose up redis

# Terminal 2: Run backend dev server
pnpm --filter backend dev
```

Backend runs on http://localhost:3000 with tsx hot reload.

### Backend File Structure

```
apps/backend/src/
├── server.ts          # Fastify app setup & middleware
├── config/            # Environment & config management
├── routes/            # API endpoint definitions
├── services/          # Business logic
├── jobs/              # BullMQ job workers
├── middlewares/       # Custom middlewares
├── utils/             # Helper functions
└── types/             # TypeScript types
```

### Creating a New API Endpoint

```typescript
// apps/backend/src/routes/users.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function usersRouter(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const { id } = request.params;
    // Business logic
    return { id, name: 'User' };
  });
}

// Then register in server.ts
fastify.register(usersRouter, { prefix: '/api' });
```

### Backend Testing

```bash
# Run unit tests
pnpm --filter backend test

# Watch mode
pnpm --filter backend test -- --watch

# Coverage
pnpm --filter backend test -- --coverage
```

## Database Management

### Prisma Commands

```bash
# View database in visual UI
pnpm db:studio        # Opens Prisma Studio at localhost:5555

# Push schema changes to dev database (without migrations)
pnpm db:push

# Create a new migration
pnpm db:migrate

# Reset database (dev only!)
pnpm db:reset         # Drops, recreates, runs all migrations

# Generate Prisma client
pnpm --filter @dragonvite/database generate
```

### Editing Schema

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:push` (for dev)
3. Run `pnpm db:migrate` (to create migration file)
4. Prisma Client regenerates automatically

**Example schema change:**

```prisma
// packages/database/prisma/schema.prisma
model User {
  id    String  @id @default(cuid())
  email String  @unique
  name  String?
  role  Role    @default(USER)

  // New field
  phone String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

Then:

```bash
pnpm db:push
```

## Code Quality

### Linting & Formatting

```bash
# Lint all code
pnpm lint

# Fix linting errors
pnpm lint -- --fix

# Format all code
pnpm format

# Check formatting without changing
pnpm format:check

# Type checking
pnpm type-check
```

### SonarQube

SonarQube analyzes code for bugs, vulnerabilities, and code smells.

**Access dashboard:**

- URL: http://localhost:9000
- Default login: admin/admin

**First-time setup:**

1. Login to http://localhost:9000
2. Change password immediately (Projects → Administration → Security)
3. Create token (Administration → Security → Users)
4. Add to GitHub Secrets: `SONAR_TOKEN`

**Run local analysis:**

```bash
pnpm sonar
```

**View results:**

- Dashboard shows all issues
- Filter by severity: Blocker, Critical, Major, Minor, Info
- Click issue to see fix suggestions

### Improving Code Quality

```bash
# Fix common issues
pnpm lint -- --fix
pnpm format

# Type check finds potential bugs
pnpm type-check

# Run tests to catch regressions
pnpm test

# View SonarQube dashboard for deeper analysis
# http://localhost:9000
```

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Watch mode (re-run on file change)
pnpm test -- --watch

# Coverage report
pnpm test -- --coverage

# Filter tests by pattern
pnpm test -- --grep "user"

# Run single test file
pnpm test -- apps/backend/src/services/userService.test.ts
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
pnpm test:e2e

# Watch mode
pnpm test:e2e -- --watch

# Run specific test file
pnpm test:e2e -- users.spec.ts

# Debug mode (opens Playwright Inspector)
pnpm test:e2e -- --debug
```

## Debugging

### VS Code Debugger

**Debug Backend:**

1. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend",
      "cwd": "${workspaceFolder}/apps/backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

2. Press F5 or Run → Start Debugging
3. Set breakpoints in code
4. Inspector opens automatically

**Debug Frontend:**

1. Run frontend: `pnpm --filter frontend dev`
2. Open DevTools: F12 in browser
3. Go to Sources tab
4. Set breakpoints in TypeScript files
5. Breakpoint hits when code executes

### Logging

**Backend (Pino):**

```typescript
import pino from 'pino';

const logger = pino();
logger.info({ userId: 123 }, 'User logged in');
logger.error({ error }, 'Database error');
```

**Frontend:**

```typescript
console.log('Debug info', data);
console.error('Error occurred', error);

// Use React DevTools extension for component inspection
```

## Common Issues & Solutions

### "Port 80 already in use"

```bash
# Find process using port 80
lsof -i :80

# Kill process
kill -9 <PID>

# Or use different port in docker-compose.yml
# Change: ports: - "8080:80"
```

### "Database connection failed"

```bash
# Check if Postgres is running
docker-compose logs postgres

# Or use Supabase connection instead
# Update .env.local:
# DATABASE_URL=postgresql://user:pass@host:5432/db
```

### "Prisma migrations failed"

```bash
# Reset and start over (dev only)
pnpm db:reset

# Or manually reset
rm -rf apps/backend/prisma/migrations/*
pnpm db:migrate -- --name init  # Create first migration
```

### "pnpm install fails"

```bash
# Clear pnpm cache
pnpm store prune

# Remove lock file and reinstall
rm pnpm-lock.yaml
pnpm install
```

### "Hot reload not working"

```bash
# Restart dev server
# Ctrl+C to stop
pnpm dev  # Restart

# Or rebuild Docker image
docker-compose down
docker-compose up --build
```

## Performance Optimization

### Bundle Analysis

```bash
# Frontend bundle size
pnpm --filter frontend build

# View dist folder
ls -lah apps/frontend/dist
```

### Database Queries

```bash
# Use Prisma Studio to verify queries
pnpm db:studio

# Add indexes to frequently queried fields
model User {
  id    String @id
  email String @unique
  name  String?

  @@index([name])  // Add index for name queries
}
```

## Team Collaboration

### Sharing Secrets with Doppler

```bash
# Team members run:
doppler login

# Then use Doppler in all commands:
doppler run pnpm dev
doppler run pnpm build
```

### Code Review Checklist

- [ ] Code passes `pnpm lint`
- [ ] Code passes `pnpm format:check`
- [ ] All tests pass: `pnpm test`
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] SonarQube quality gate passes on PR
- [ ] PR description explains changes

## Further Reading

- [README.md](./README.md) – Project overview & quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) – System design & data flows
- [Turborepo Documentation](https://turbo.build)
- [Fastify Documentation](https://www.fastify.io)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io)
