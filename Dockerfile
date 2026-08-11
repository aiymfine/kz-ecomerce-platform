# =============================================================================
# ShopBuilder KZ — Dockerfile (Fly.io)
# Deploys: NestJS API + React frontend (served statically from /public)
# =============================================================================

# Stage 1: Build frontend
FROM node:22-slim AS frontend-build
WORKDIR /app
RUN corepack enable && corepack prepare npm@latest --activate
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:22-slim AS backend-build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN pnpm run build

# Stage 3: Production
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_POOL_SIZE=10 \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    JWT_REFRESH_TOKEN_EXPIRE_DAYS=7 \
    SMTP_HOST=smtp.gmail.com \
    SMTP_PORT=587

COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/pnpm-lock.yaml ./
COPY --from=backend-build /app/tsconfig.json ./

# Install production deps (hoisted layout for NestJS compatibility)
RUN npm install -g pnpm@9
RUN echo "node-linker=hoisted" > .npmrc
RUN pnpm install --prod --frozen-lockfile

# Copy frontend static build
COPY --from=frontend-build /app/dist ./public

EXPOSE 3000

# Run migrations then start app
# Seed is a MANUAL one-time step: flyctl ssh console -a shopbuilder-kz
#   then: npx tsx prisma/seed.ts
CMD ["sh", "-c", "npx prisma@5 migrate deploy && node dist/main.js"]
