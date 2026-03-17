# Backend

Fastify + TypeScript backend server with Socket.io real-time support, Prisma ORM, and BullMQ job queue.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Production
pnpm start

# Testing
pnpm test
pnpm test:watch
```

## 📁 Structure

```
src/
├── server.ts              # Fastify server setup
├── config.ts              # Environment configuration
├── types.ts               # TypeScript type definitions
├── routes/                # API route handlers
│   ├── health.ts          # Health check endpoint
│   └── users.ts           # User routes (example)
├── services/              # Business logic
│   ├── userService.ts     # User operations
│   └── gameService.ts     # Game operations (example)
├── socket/                # Socket.io real-time
│   └── index.ts           # Socket.io setup & handlers
├── jobs/                  # BullMQ background jobs
│   └── index.ts           # Job definitions & workers
└── utils/                 # Helper functions
```

## 🔌 API Endpoints

### Health Check

- `GET /api/health` – Server health status

### Users (Example)

- `GET /api/users/:id` – Get user by ID
- `POST /api/users` – Create new user
- `PUT /api/users/:id` – Update user
- `DELETE /api/users/:id` – Delete user

## 🔌 Socket.io Events

### Game Events

- `game:join` – User joins a game room
- `game:move` – Player moves in game
- `game:state` – Broadcast game state to room
- `game:user-joined` – Notify others when user joins

### Chat Events

- `chat:message` – Send chat message
- `chat:new-message` – Receive chat message

## 📦 Dependencies

- **fastify** – HTTP server framework
- **@fastify/websocket** – WebSocket support
- **socket.io** – Real-time bidirectional communication
- **prisma** – Type-safe ORM
- **zod** – Input validation
- **bullmq** – Job queue
- **pino** – Logging
- **redis** – Cache & queue storage

## 🛠️ Configuration

Environment variables (see `../.env.example`):

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
```

## 📝 Creating New Routes

```typescript
// src/routes/items.ts
import { FastifyInstance } from 'fastify';

export async function itemsRouter(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const { id } = request.params;
    // Business logic
    return { id, name: 'Item' };
  });
}

// In src/server.ts, add:
// await fastify.register(itemsRouter, { prefix: '/api' });
```

## 📝 Creating New Services

```typescript
// src/services/itemService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getItemById(id: string) {
  return prisma.item.findUnique({ where: { id } });
}

export async function createItem(data: { name: string; description: string }) {
  return prisma.item.create({ data });
}
```

## 📝 Creating New Jobs

```typescript
// In src/jobs/index.ts
export interface MyJobData {
  param1: string;
  param2: number;
}

export const myQueue = new Queue<MyJobData>('my-queue', queueOptions);

export const myWorker = new Worker<MyJobData>(
  'my-queue',
  async (job) => {
    // Do work here
    return { success: true };
  },
  { connection: queueOptions.connection }
);

export async function addMyJob(data: MyJobData) {
  return myQueue.add('my-job', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

Example test:

```typescript
// src/services/userService.test.ts
import { describe, it, expect } from 'vitest';
import { getUserById } from './userService';

describe('userService', () => {
  it('should find user by id', async () => {
    const user = await getUserById('test-id');
    expect(user).toBeDefined();
  });
});
```

## 🔐 Security

- **Helmet** – HTTP security headers
- **CORS** – Cross-origin requests validation
- **Rate Limiting** – Per-IP request throttling
- **Input Validation** – Zod schema validation
- **Prisma** – Parameterized queries (SQL injection prevention)

## 📊 Logging

```typescript
import { Logger } from 'pino';

fastify.log.info('Info message');
fastify.log.error({ error }, 'Error message');
fastify.log.debug({ data }, 'Debug message');
```

## 🐛 Debugging

```bash
# VS Code debugger - add to .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Backend",
  "cwd": "${workspaceFolder}/apps/backend",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev"],
  "console": "integratedTerminal"
}

# Then press F5 to start debugging
```

## 📚 Resources

- [Fastify Documentation](https://www.fastify.io/)
- [Socket.io Documentation](https://socket.io/)
- [Prisma Documentation](https://www.prisma.io/)
- [BullMQ Documentation](https://docs.bullmq.io/)
