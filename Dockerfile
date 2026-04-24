# Stage 1: Dependencies
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS builder

COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN npx prisma generate
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY --from=builder /app/dist ./dist

# Install prod deps + prisma CLI (needed to generate client at runtime)
RUN pnpm install --frozen-lockfile --prod && pnpm add --save-prod prisma@^5.22.0
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
