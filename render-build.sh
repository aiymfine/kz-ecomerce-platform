#!/bin/bash
set -e

# Install pnpm
npm install -g pnpm@9

# Install backend deps
pnpm install --frozen-lockfile

# Generate Prisma client
npx prisma generate

# Build backend
pnpm run build

# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Copy frontend build to public
cp -r frontend/dist ./public

echo "Build complete!"
