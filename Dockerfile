# Multi-stage build for Dragonvite backend

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY package.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages and backend
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma

# Server runs on port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start backend
CMD ["node", "dist/server.js"]
