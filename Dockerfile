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

# Copy built JS + prisma schema
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/pnpm-lock.yaml ./

# Install production deps fresh (avoids pnpm symlink breakage from COPY)
RUN npm install -g pnpm@9
RUN pnpm install --prod --frozen-lockfile
## @prisma/client postinstall already runs prisma generate — no need for a separate step
## (npx would download latest prisma v7 which breaks our v5 schema)

# Copy frontend static files (if built)
COPY --from=frontend-build /app/dist ./public

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
