# ShopBuilder — E-Commerce SaaS Platform for Local Kazakh Merchants

> A Shopify-clone built as a multi-tenant SaaS: one platform, many independent stores.

## 📌 What Is This?

ShopBuilder is a **B2B2C e-commerce SaaS platform** where merchants sign up, get their own online store (with isolated data), and manage products, inventory, orders, payments, and more through a REST API.

Localized for Kazakhstan: **Kaspi Pay**, **Halyk Bank**, tiyin-based pricing, Haversine warehouse routing.

## 🏗 Architecture

| Decision | Implementation |
|----------|---------------|
| **Multi-tenancy** | Schema-per-tenant — each merchant gets an isolated PostgreSQL schema (30+ tables) with automatic `search_path` routing via middleware |
| **Authentication** | JWT access tokens (30 min) + refresh tokens (7 days) with rotation, bcryptjs cost 12 |
| **Authorization** | RBAC guards (merchant, super_admin, support), AdminGuard for platform-level routes |
| **Validation** | Zod schemas for env config + DTOs, custom `ZodValidationPipe` |
| **Rate Limiting** | Redis-backed token bucket (5 req/min on auth endpoints), `X-RateLimit-*` response headers |
| **Audit Logging** | Global interceptor — logs every state-changing request (who, what, when, IP) |
| **Monetary Values** | All amounts stored in **tiyin** (1 KZT = 100 tiyin) to avoid floating-point errors |
| **Email** | Nodemailer + Gmail SMTP, async via BullMQ queue |
| **Background Jobs** | BullMQ with Redis — email delivery, abandoned cart scanning (cron every 15 min) |
| **Caching** | Redis — storefront products (60s), categories (120s), `X-Cache-Status` response header |
| **Security** | Helmet (security headers), gzip compression, CORS, graceful shutdown |
| **Observability** | `X-Request-Id` UUID per request in logs + response headers |
| **API Documentation** | Swagger/OpenAPI at `/api/docs` with Bearer auth UI |

## 🧱 Modules (20)

| Module | Description |
|--------|-------------|
| **Auth** | Register, login, logout, refresh, `/me`. Email verification (6-digit code), password reset |
| **Admin** | Merchant CRUD, approve/reject/suspend, platform analytics, queue status, audit log |
| **Stores** | Merchant store configuration and management |
| **Products** | Full CRUD, variant matrix (Size × Color × Material, auto SKU), category tree (materialized path) |
| **Storefront** | Public catalog API with Redis caching — browse products, categories, product detail by slug |
| **Cart** | Shopping cart — add, update quantity, remove, clear |
| **Checkout** | Full ACID transaction — cart → order → payment → inventory reservation. Any failure = rollback |
| **Orders** | Order lifecycle, status tracking, fulfillment management |
| **Inventory** | Atomic stock adjustments via `SELECT FOR UPDATE`. Transfer between warehouses. Haversine nearest-warehouse |
| **Payments** | Payment initiation, Kaspi Pay & Halyk Bank callbacks, refund processing |
| **Discounts** | Promo codes — create, validate, apply to orders |
| **Warehouses** | Multi-warehouse management with geographic coordinates |
| **Customers** | Customer profiles, addresses, order history |
| **Staff** | Invite staff, manage roles & permissions |
| **Webhooks** | CRUD + HMAC-SHA256 signatures, exponential backoff, dead letter after 5 retries |
| **Email** | Nodemailer service — verification, password reset, order confirmation, payment receipt |
| **Subscriptions** | Subscription box billing |
| **Abandoned Carts** | Track abandoned carts, automated recovery via BullMQ cron (every 15 min) |
| **Analytics** | Sales dashboard, product performance, customer analytics, inventory status |
| **Templates** | Nunjucks sandboxed template engine for customizable store themes |

## 📊 Project Stats

| Metric | Count |
|--------|-------|
| Modules | 20 |
| TypeScript source files | 130+ |
| Prisma data models | 34 |
| Tenant tables per schema | 30+ |
| API Endpoints | 80+ |
| Test suites | 2 (auth e2e, admin RBAC) |
| Tests | 30 (28 passed, 2 skipped — rate-limited) |
| CI/CD | GitHub Actions (lint, build, test, Docker build) |

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 15+
- Redis 7+

### Local Development

```bash
pnpm install
cp .env.example .env          # Edit with your values
npx prisma generate
npx prisma migrate dev
npx prisma db seed
pnpm start:dev
```

### Docker (one command)

```bash
docker-compose up -d
```

This automatically runs migrations → seeds the database → starts the app. Includes PostgreSQL 15 + Redis 7 with health checks.

App: http://localhost:3001 | Swagger: http://localhost:3001/api/docs | Frontend: http://localhost:5173

### Frontend (Storefront)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on http://localhost:5173 and proxies `/api` requests to the backend at localhost:3001.

## 📡 Key API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register merchant (sends verification email) |
| POST | `/api/auth/verify-email` | Verify email with 6-digit code |
| POST | `/api/auth/resend-verification` | Resend verification code |
| POST | `/api/auth/login` | Login (returns access + refresh tokens) |
| POST | `/api/auth/refresh` | Refresh access token (rotation enabled) |
| POST | `/api/auth/logout` | Logout (blacklists refresh token) |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Current merchant profile |

### Health & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (DB + Redis latency, uptime, version) |
| GET | `/api/admin/merchants` | List all merchants |
| POST | `/api/admin/merchants/:id/approve` | Approve merchant |
| GET | `/api/admin/queue/status` | BullMQ queue status (job counts, recent jobs) |
| GET | `/api/admin/audit-log` | Platform audit log |

### E-Commerce
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stores/:storeId/products` | Create product |
| POST | `/api/stores/:storeId/products/:id/variants` | Generate variant matrix |
| GET | `/api/stores/:storeId/inventory` | List inventory (cursor pagination) |
| POST | `/api/stores/:storeId/inventory/transfer` | Transfer between warehouses |
| GET | `/api/stores/:storeId/inventory/nearest-warehouse` | Nearest warehouse (Haversine) |
| POST | `/api/stores/:storeId/checkout` | Checkout (ACID transaction) |
| POST | `/api/stores/:storeId/payments/initiate` | Initiate payment |
| POST | `/api/stores/:storeId/promo-codes/:code/validate` | Validate promo code |
| GET | `/api/storefront/products` | Public product listing (Redis cached) |
| GET | `/api/storefront/products/:slug` | Product by slug (Redis cached) |
| GET | `/api/storefront/categories` | Public category tree (Redis cached) |

### Webhooks & Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stores/:storeId/webhooks` | Create webhook |
| GET | `/api/stores/:storeId/webhooks/:id/events` | Webhook delivery log |

> Full endpoint list available at `/api/docs` (Swagger UI) or in `openapi.yaml`.

## 🧪 Testing

```bash
pnpm test                    # Run all tests (30 tests, 2 suites)
pnpm test -- test/auth.spec.ts    # Auth e2e only
pnpm test -- test/admin.spec.ts   # Admin RBAC only
```

## 🛡 Security

- **JWT + RBAC** — role-based guards on all protected routes
- **Email verification** — merchants blocked from protected endpoints until verified
- **Rate limiting** — Redis-backed, visible via `X-RateLimit-*` headers
- **Token rotation** — old refresh tokens blacklisted on rotation
- **Input validation** — Zod schemas on every DTO + env config
- **HMAC-SHA256 webhooks** — signed payloads, exponential backoff, dead letter queue
- **Helmet** — security headers (XSS, HSTS, etc.), strict CSP in production
- **Schema isolation** — tenants cannot access each other's data
- **Atomic operations** — `SELECT FOR UPDATE` prevents inventory race conditions
- **Audit logging** — every state change logged with actor, action, IP, user agent

## 📁 Project Structure

```
src/
├── common/              # Shared infrastructure
│   ├── audit/           # Global audit interceptor & service
│   ├── decorators/      # @Roles, @CurrentUser, @RateLimit, @Tenant
│   ├── filters/         # HTTP exception filter
│   ├── guards/          # JWT, Roles, Admin, Verified, Rate-limit
│   ├── health/          # Health check controller
│   ├── interceptors/    # Logging (with request ID), response transform
│   ├── middleware/       # Tenant middleware (search_path routing)
│   ├── pipes/           # Zod validation pipe
│   ├── queue/           # BullMQ queue module, service, scheduler
│   ├── redis/           # Redis module & service
│   └── utils/           # Haversine, SKU builder, slugify, tiyin math
├── config/              # Environment config & Zod validation
├── modules/             # 20 feature modules
└── workers/             # BullMQ standalone processors
    └── processors/      # Email & abandoned cart processors
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.x (strict) |
| Framework | NestJS 10+ |
| ORM | Prisma 5+ |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7 (ioredis + BullMQ) |
| Validation | Zod |
| Auth | Passport + JWT |
| Email | Nodemailer (Gmail SMTP) |
| Security | Helmet, compression |
| API Docs | Swagger / OpenAPI |
| Containers | Docker + docker-compose (multi-stage) |
| CI/CD | GitHub Actions |
| Package Manager | pnpm 10 |

## 📝 Environment Variables

See `.env.example` for all configuration options. Environment is validated at startup via Zod schema.

## 📄 License

University Final Project
