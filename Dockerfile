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

# Sensible defaults for all required env vars.
# Override via Dokku config:set or docker-compose environment.
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_POOL_SIZE=20 \
    JWT_SECRET_KEY=change-me-in-production-min-32-chars!! \
    JWT_ALGORITHM=HS256 \
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    JWT_REFRESH_TOKEN_EXPIRE_DAYS=7 \
    CORS_ORIGINS="*" \
    SMTP_HOST=smtp.gmail.com \
    SMTP_PORT=587 \
    SMTP_USER="" \
    SMTP_PASSWORD="" \
    SMTP_FROM="" \
    APP_URL=http://localhost:3000

# Copy built JS + prisma schema
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/pnpm-lock.yaml ./

# Install production deps — use hoisted layout so transitive deps (express, etc.)
# are accessible from the root, matching how NestJS imports work
RUN npm install -g pnpm@9
RUN echo "node-linker=hoisted" > .npmrc
RUN pnpm install --prod --frozen-lockfile

# Copy frontend static files (if built)
COPY --from=frontend-build /app/dist ./public

EXPOSE 3001
# Use prisma@5 explicitly to avoid npx downloading incompatible v7+
CMD ["sh", "-c", "npx prisma@5 migrate deploy && node dist/main.js"]
