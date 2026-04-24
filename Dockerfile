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
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

EXPOSE 3000

CMD ["node", "dist/main"]
