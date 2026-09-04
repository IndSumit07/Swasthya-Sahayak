# ==============================================================================
# Swasthya Sahayak — Production Backend Dockerfile
# Optimized multi-stage build with Prisma Client, TypeScript & Healthchecks
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL & CA certificates required for Prisma engine
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy TypeScript config and application source code
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma Client for Linux runtime
RUN npx prisma generate

# Build TypeScript to production JavaScript (dist/)
RUN npm run build

# Remove development dependencies to minimize node_modules size
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-slim AS runner

WORKDIR /app

# Install curl for container health monitoring and OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=4000

# Copy production node_modules (including generated Prisma client artifacts)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Non-privileged user for container security
USER node

EXPOSE 4000

# Container Healthcheck (polls Express health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

# Start the compiled Node Express application
CMD ["node", "dist/server.js"]
