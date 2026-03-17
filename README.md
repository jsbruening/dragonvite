# Dragonvite Monorepo

> A production-ready monorepo scaffold for Dragonvite using Turborepo, Node.js, React, and a modern tech stack.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.17.0
- pnpm >= 8.0.0
- Docker & Docker Compose (for local development with all services)
- Git

### Installation

1. **Clone the repository:**

```bash
git clone <repo-url>
cd dragonvite
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Setup environment variables:**

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Using Doppler (recommended for team):**

```bash
# Install Doppler CLI: https://docs.doppler.com/docs/cli
doppler login

# Run development with injected secrets
doppler run pnpm dev
```

### Development

**Start all services locally with Docker Compose:**

```bash
pnpm dev
```

This starts:

- **Frontend** (port 80 via Nginx): http://localhost
- **Backend API** (internal port 3000): Proxied via Nginx to `/api`
- **Redis** (port 6379): Cache & job queue
- **Bull Board** (port 3001): Job queue UI - http://localhost:3001
- **SonarQube** (port 9000): Code quality dashboard - http://localhost:9000

**Run individual commands:**

```bash
pnpm build          # Build all apps and packages
pnpm test           # Run all tests
pnpm lint           # Lint all code
pnpm format         # Format all code
pnpm type-check     # Type check all packages
```

## 📁 Project Structure

```
dragonvite/
├── apps/
│   ├── frontend/           # Vite + React + TypeScript
│   │   └── src/
│   │       ├── components/ # React components
│   │       ├── pages/      # Page components
│   │       ├── hooks/      # Custom hooks
│   │       ├── store/      # Zustand stores
│   │       └── utils/      # Utilities
│   └── backend/            # Fastify + TypeScript
│       └── src/
│           ├── routes/     # API endpoints
│           ├── services/   # Business logic
│           ├── jobs/       # BullMQ jobs
│           └── utils/      # Utilities
├── packages/
│   ├── shared/             # Shared types, constants, utils
│   └── database/           # Prisma schema & migrations
├── .github/
│   └── workflows/          # CI/CD workflows (GitHub Actions)
├── docker-compose.yml      # Local development services
├── Dockerfile              # Backend container
├── nginx.conf              # Reverse proxy config
└── README.md               # This file
```

## 🛠️ Technology Stack

### Frontend

- **Vite** – Fast build tool & dev server
- **React 18** – UI framework
- **TypeScript** – Type safety
- **TanStack Query** – Server state management & caching
- **Zustand** – Client state management
- **Material UI** – Component library
- **React Konva** – Canvas rendering for game map

### Backend

- **Fastify** – High-performance HTTP server
- **TypeScript** – Type safety
- **Socket.io** – Real-time WebSocket communication
- **Prisma** – Type-safe ORM
- **Zod** – Input validation
- **BullMQ** – Redis-backed job queue
- **Pino** – Structured logging

### Infrastructure

- **Docker & Docker Compose** – Local development
- **Nginx** – Reverse proxy & static file server
- **Redis** – Cache & job queue storage
- **Supabase** – PostgreSQL database (managed)
- **Doppler** – Secrets management
- **SonarQube** – Code quality analysis
- **GitHub Actions** – CI/CD

### Deployment

- **Oracle Cloud Always Free** – $0/month hosting (2 vCPU, 4GB RAM VMs)
- **Cloudflare R2** – Object storage
- **Cloudflare CDN** – Content delivery
- **Sentry** – Error tracking

## 🔧 Common Tasks

### Database

**Push schema changes to dev:**

```bash
pnpm db:push
```

**Create a migration:**

```bash
pnpm db:migrate
```

**Open Prisma Studio:**

```bash
pnpm db:studio
```

### Testing

**Run all tests:**

```bash
pnpm test
```

**Watch mode:**

```bash
pnpm test -- --watch
```

**Run E2E tests:**

```bash
pnpm test:e2e
```

### Code Quality

**Run SonarQube analysis locally:**

```bash
pnpm sonar
```

**Access SonarQube dashboard:**

- URL: http://localhost:9000
- Default login: admin / admin
- Change password on first login

### Building for Production

```bash
pnpm build
```

This:

1. Type-checks all packages
2. Builds the Docker image
3. Prepares frontend static files
4. Generates Prisma client

## 🚢 Deployment

### Oracle Cloud Always Free

1. **Create an Oracle VM** ($0/month, always free tier)

   ```bash
   # Ubuntu 22.04 LTS, 2 ARM vCPU, 4GB RAM
   ```

2. **Install Docker & Docker Compose on the VM**

   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   sudo usermod -aG docker $USER
   ```

3. **Clone repo and start services**

   ```bash
   git clone <repo-url>
   cd dragonvite
   doppler login  # Authenticate with Doppler
   docker-compose up -d
   ```

4. **Access your deployment**
   - Frontend: `http://<oracle-ip>`
   - Bull Board: `http://<oracle-ip>:3001`
   - Backend API: `http://<oracle-ip>/api/*`

### GitHub Actions CI/CD

Workflows automatically run on PR and merge to `main`:

- `lint.yml` – ESLint + Prettier
- `test.yml` – Vitest tests
- `build.yml` – Docker build verification
- `sonarqube.yml` – Code quality gate
- `deploy.yml` – Deploy to Oracle Cloud (on merge to main)

## 📊 SonarQube Setup

**First-time setup:**

1. Access http://localhost:9000
2. Login with default credentials: admin / admin
3. Change password immediately
4. Create a token:
   - Administration → Security → Users → Tokens
   - Create token: `sonar_${project-key}`
   - Save token to GitHub Secrets as `SONAR_TOKEN`

**Viewing analysis:**

- Dashboard shows issues, bugs, code smells, coverage
- Quality gates fail builds if gate not met

## 📝 Environment Variables

See `.env.example` for all required variables. Key variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Frontend
VITE_API_URL=http://localhost/api
VITE_WS_URL=http://localhost

# Backend
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret

# External services
RESEND_API_KEY=your-api-key
OLLAMA_API_URL=http://ollama-host:11434
SENTRY_DSN=https://your-sentry-dsn
```

**Using Doppler:**

```bash
doppler run pnpm dev  # Inject all secrets automatically
```

## 🔒 Security

- **Helmet** – HTTP security headers
- **CORS** – Cross-Origin Resource Sharing
- **Rate Limiting** – Per-IP request throttling
- **Zod validation** – Input sanitization
- **Prisma parameterized queries** – SQL injection prevention
- **JWT authentication** – Secure token-based auth

## 📚 Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) – Detailed dev setup & debugging
- [ARCHITECTURE.md](./ARCHITECTURE.md) – System architecture & data flows
- [Tech Plan](../plans/dragon_vite_tech_plan.md) – Comprehensive tech stack rationale

## 🆘 Troubleshooting

**Docker Compose fails to start:**

```bash
docker-compose down -v      # Remove all containers and volumes
docker-compose up --build   # Rebuild from scratch
```

**Prisma migration errors:**

```bash
pnpm db:reset   # Reset database (dev only!)
pnpm db:push    # Sync schema
```

**Port conflicts:**

```bash
# Check what's using port 80, 3000, etc.
lsof -i :80
# Kill the process
kill -9 <PID>
```

**SonarQube password reset:**

```bash
# Access SonarQube container shell
docker exec -it dragonvite-sonarqube bash
# Use admin interface at http://localhost:9000
```

## 📄 License

MIT

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "feat: description"`
3. Push branch: `git push origin feature/name`
4. Open Pull Request

All PRs must pass linting, testing, and code quality gates before merging.

## 📞 Support

For issues or questions, open a GitHub issue or contact the team.
