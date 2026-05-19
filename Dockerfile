# Stage 1: Build frontend
FROM node:22-slim AS frontend-build
WORKDIR /app
RUN corepack enable && corepack prepare npm@latest --activate
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build 2>/dev/null || mkdir -p dist

# Stage 2: Build backend
FROM node:22-slim AS backend-build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN pnpm run build

# Stage 3: Production
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy built JS
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/pnpm-lock.yaml ./

# Install production deps fresh (avoids pnpm symlink breakage from COPY)
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --frozen-lockfile
RUN npx prisma generate

# Copy frontend static files (if built)
COPY --from=frontend-build /app/dist ./public

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
