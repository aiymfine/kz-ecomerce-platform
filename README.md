# ShopBuilder — Shopify Clone for Local Kazakh Merchants

E-commerce platform built with **NestJS 10**, **TypeScript 5**, **Prisma 5**, **PostgreSQL 15**, and **Redis 7**.

## Architecture

- **Multi-tenancy**: Schema-per-tenant with `search_path` middleware
- **Auth**: JWT access (30min) + refresh (7d) tokens, bcryptjs hashing
- **Validation**: Zod schemas bridged to NestJS pipes
- **Rate limiting**: Redis token bucket (5 req/min on auth endpoints)
- **API Docs**: Swagger at `/docs`

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (latest)
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed

# Start development server
pnpm start:dev
```

### Docker

```bash
# Start all services (PostgreSQL + Redis + App)
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npx prisma db seed
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **API base**: http://localhost:3000/api

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register merchant |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/admin/merchants` | List merchants (admin) |
| POST | `/api/admin/merchants/:id/approve` | Approve merchant |
| GET | `/api/stores` | List merchant stores |
| POST | `/api/stores` | Create store |
| GET | `/api/stores/:storeId/products` | List products |
| POST | `/api/stores/:storeId/products` | Create product |
| POST | `/api/stores/:storeId/products/:id/variants` | Generate variant matrix |
| GET | `/api/stores/:storeId/categories` | List categories |
| GET | `/api/stores/:storeId/webhooks` | List webhooks |
| GET | `/api/stores/:storeId/staff` | List staff |

## Monetary Values

All monetary values are stored in **tiyin** (1 KZT = 100 tiyin).

## Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- test/auth.spec.ts

# Run with coverage
pnpm test:cov
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm start:dev` | Start with hot reload |
| `pnpm build` | Compile TypeScript |
| `pnpm start:prod` | Run compiled code |
| `pnpm lint` | Lint with ESLint |
| `pnpm test` | Run Jest tests |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate:dev` | Create and apply migration |
| `pnpm prisma:seed` | Seed database |

## Environment Variables

See `.env.example` for all configuration options.

## License

University Final Project
