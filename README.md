# ShopBuilder — E-Commerce SaaS Platform for Local Kazakh Merchants

> A Shopify-clone built as a multi-tenant SaaS: one platform, many independent stores.

## 📌 What Is This?

ShopBuilder is a **B2B2C e-commerce SaaS platform** where merchants sign up, get their own online store (with isolated data), and can manage products, inventory, orders, payments, and more — all through a REST API.

**Think Shopify, but localized for Kazakhstan** (Kaspi Pay, Halyk Bank, tiyin-based pricing, Haversine warehouse routing).

## 🏗 Architecture

| Decision | Implementation |
|----------|---------------|
| **Multi-tenancy** | Schema-per-tenant — each merchant gets their own PostgreSQL schema (30+ tables) with automatic `search_path` routing via middleware |
| **Authentication** | JWT access tokens (30 min) + refresh tokens (7 days), bcryptjs cost 12 |
| **Authorization** | RBAC guards (merchant, super_admin, support), AdminGuard for platform-level routes |
| **Validation** | Zod schemas + class-validator, custom `ZodValidationPipe` |
| **Rate Limiting** | Redis-backed token bucket (5 req/min on auth endpoints) |
| **Audit Logging** | Global interceptor — logs every state-changing request (who, what, when, IP) |
| **Monetary Values** | All amounts stored in **tiyin** (1 KZT = 100 tiyin) to avoid floating-point errors |
| **API Documentation** | Swagger/OpenAPI at `/docs` |

## 🧱 Modules (17 total)

### Core Infrastructure

| Module | Description |
|--------|-------------|
| **Auth** | Register, login, logout, refresh, `/me`. Password hashing, JWT, RBAC roles, rate limiting |
| **Admin** | Merchant CRUD, approve/reject/suspend, store management, platform analytics, audit log viewer |
| **Staff** | Invite staff to stores, manage roles & permissions, remove access |
| **Stores** | Merchant store configuration and management |

### E-Commerce

| Module | Description |
|--------|-------------|
| **Products** | Full CRUD, **variant matrix** (Size × Color × Material, up to 100 combos, auto SKU generation), **category tree** (materialized path) |
| **Customers** | Customer profiles, addresses, order history |
| **Storefront** | Public catalog API — browse products, categories, product detail by slug |
| **Cart** | Shopping cart — add, update quantity, remove items, clear |
| **Checkout** | **Full ACID transaction** — cart → order → payment → inventory reservation in one atomic operation. Any failure = full rollback |
| **Orders** | Order lifecycle, status tracking, fulfillment management |
| **Inventory** | **Atomic stock adjustments** via `SELECT FOR UPDATE` (prevents race conditions). Transfer between warehouses. **Haversine distance** calculation for nearest-warehouse routing |
| **Warehouses** | Multi-warehouse management with geographic coordinates |
| **Payments** | Payment initiation, Kaspi Pay & Halyk Bank callbacks, refund processing (architecture ready for real gateway integration) |
| **Discounts** | Promo codes — create, validate, apply to orders |

### Business Features

| Module | Description |
|--------|-------------|
| **Subscriptions** | Subscription box billing — create boxes, subscribe customers |
| **Abandoned Carts** | Track abandoned carts, recovery logic for automated email sequences |
| **Webhooks** | CRUD + HMAC-SHA256 signatures, event delivery logging, retry counts, exponential backoff |
| **Templates** | Nunjucks sandboxed template engine for customizable store themes |
| **Analytics** | Sales dashboard, product performance, customer analytics, inventory status |

## ⚙ Background Workers (7)

Workers are BullMQ-ready stubs — structured for real queue integration:

| Worker | Purpose |
|--------|---------|
| `webhook.worker` | Dispatches events to webhook URLs with retry logic |
| `emails.worker` | Transactional email queue (registration, orders, recovery) |
| `inventory.worker` | Async stock reservation and release |
| `audit.worker` | Batch audit log processing |
| `billing.worker` | Subscription billing cycles |
| `abandoned-carts.worker` | Recovery email sequences for abandoned carts |
| `main` | Orchestrator entry point |

## 🛡 Security

- **JWT + RBAC** — all routes protected by role-based guards
- **Rate limiting** — Redis-backed, prevents brute-force on auth
- **Input validation** — Zod + class-validator on every DTO
- **CORS** — configured for cross-origin requests
- **Audit interceptor** — every state change is logged
- **Schema isolation** — tenants cannot access each other's data
- **Atomic operations** — `SELECT FOR UPDATE` prevents inventory race conditions

## 📊 Project Stats

| Metric | Count |
|--------|-------|
| Modules | 18 |
| Source files (modules) | 82 |
| Worker files | 9 |
| Shared utilities/guards/pipes | 23 |
| Prisma data models | 34 |
| Tenant tables per schema | 30+ |
| API Endpoints | 116+ |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm (latest)
- PostgreSQL 15+ (connection pool: 9 default, configurable via `DATABASE_POOL_SIZE` in `.env`)
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

# Seed database (admin + 2 merchants + stores + sample products)
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

## 📡 API Endpoints

Once running: **Swagger UI** at http://localhost:3001/docs | **API base** at http://localhost:3001/api

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register merchant (sends verification email) |
| POST | `/api/auth/verify-email` | Verify email with 6-digit code |
| POST | `/api/auth/resend-verification` | Resend verification code |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/refresh` | Refresh access token (rotation enabled) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current merchant profile |
| POST | `/api/auth/admin/login` | Admin login |

### Platform Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/merchants` | List all merchants |
| POST | `/api/admin/merchants/:id/approve` | Approve merchant |
| POST | `/api/admin/merchants/:id/reject` | Reject merchant |
| POST | `/api/admin/merchants/:id/suspend` | Suspend merchant |
| POST | `/api/admin/merchants/:id/activate` | Activate merchant |
| GET | `/api/admin/stores` | List all stores |
| POST | `/api/admin/stores/:id/suspend` | Suspend store |
| POST | `/api/admin/stores/:id/activate` | Activate store |
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/audit-log` | Platform audit log |

### Stores & Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | List merchant's stores |
| POST | `/api/stores` | Create store |
| GET | `/api/stores/:id` | Store details |
| PATCH | `/api/stores/:id` | Update store |
| GET | `/api/stores/:storeId/staff` | List staff |
| POST | `/api/stores/:storeId/staff` | Invite staff |
| PATCH | `/api/stores/:storeId/staff/:id` | Update role/permissions |
| DELETE | `/api/stores/:storeId/staff/:id` | Remove staff |

### Products & Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/products` | List products |
| POST | `/api/stores/:storeId/products` | Create product |
| GET | `/api/stores/:storeId/products/:id` | Product details |
| PATCH | `/api/stores/:storeId/products/:id` | Update product |
| DELETE | `/api/stores/:storeId/products/:id` | Archive product |
| POST | `/api/stores/:storeId/products/:id/variants` | Generate variant matrix |
| PATCH | `/api/stores/:storeId/products/:id/variants/:variantId` | Update variant |
| DELETE | `/api/stores/:storeId/products/:id/variants/:variantId` | Delete variant |
| GET | `/api/stores/:storeId/categories` | List categories |
| POST | `/api/stores/:storeId/categories` | Create category |
| PATCH | `/api/stores/:storeId/categories/:id` | Update category |
| DELETE | `/api/stores/:storeId/categories/:id` | Delete category |

### Warehouses & Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/warehouses` | List warehouses |
| POST | `/api/stores/:storeId/warehouses` | Create warehouse |
| PATCH | `/api/stores/:storeId/warehouses/:id` | Update warehouse |
| DELETE | `/api/stores/:storeId/warehouses/:id` | Delete warehouse |
| GET | `/api/stores/:storeId/inventory` | List inventory |
| POST | `/api/stores/:storeId/inventory` | Set inventory |
| PATCH | `/api/stores/:storeId/inventory/:id` | Atomic stock adjust |
| POST | `/api/stores/:storeId/inventory/transfer` | Transfer between warehouses |
| GET | `/api/stores/:storeId/inventory/nearest-warehouse` | Nearest warehouse (Haversine) |

### Cart & Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/cart` | Get/create cart |
| POST | `/api/stores/:storeId/cart/items` | Add item to cart |
| PATCH | `/api/stores/:storeId/cart/items/:id` | Update item quantity |
| DELETE | `/api/stores/:storeId/cart/items/:id` | Remove item |
| DELETE | `/api/stores/:storeId/cart` | Clear cart |
| POST | `/api/stores/:storeId/checkout` | Checkout (ACID transaction) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/orders` | List orders |
| GET | `/api/stores/:storeId/orders/:orderNumber` | Order details |
| PATCH | `/api/stores/:storeId/orders/:id/status` | Update order status |
| POST | `/api/stores/:storeId/orders/:id/fulfill` | Create fulfillment |
| PATCH | `/api/stores/:storeId/orders/:id/fulfillments/:fulfillmentId` | Update fulfillment |

### Payments & Discounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stores/:storeId/payments/initiate` | Initiate payment |
| POST | `/api/stores/:storeId/payments/callback/kaspi` | Kaspi Pay callback |
| POST | `/api/stores/:storeId/payments/callback/halyk` | Halyk Bank callback |
| POST | `/api/stores/:storeId/payments/:id/refund` | Process refund |
| GET | `/api/stores/:storeId/payments/order/:orderId` | Order payments |
| POST | `/api/stores/:storeId/promo-codes` | Create promo code |
| GET | `/api/stores/:storeId/promo-codes` | List promo codes |
| POST | `/api/stores/:storeId/promo-codes/:code/validate` | Validate promo code |

### Customers & Storefront
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/storefront/auth/register` | Customer registration |
| POST | `/api/storefront/auth/login` | Customer login |
| GET | `/api/storefront/products` | Public product listing |
| GET | `/api/storefront/products/:slug` | Product by slug |
| GET | `/api/storefront/categories` | Public category tree |
| GET | `/api/storefront/categories/:slug/products` | Products in category |
| GET | `/api/stores/:storeId/customers/me` | Customer profile |
| GET | `/api/stores/:storeId/customers/me/addresses` | Customer addresses |

### Webhooks, Subscriptions, Analytics, Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/webhooks` | List webhooks |
| POST | `/api/stores/:storeId/webhooks` | Create webhook |
| PATCH | `/api/stores/:storeId/webhooks/:id` | Update webhook |
| DELETE | `/api/stores/:storeId/webhooks/:id` | Delete webhook |
| POST | `/api/stores/:storeId/subscription-boxes` | Create subscription box |
| POST | `/api/stores/:storeId/subscriptions/subscribe` | Subscribe to box |
| GET | `/api/stores/:storeId/analytics/sales` | Sales dashboard |
| GET | `/api/stores/:storeId/analytics/products` | Product performance |
| GET | `/api/stores/:storeId/analytics/customers` | Customer analytics |
| GET | `/api/stores/:storeId/analytics/inventory` | Inventory status |
| GET | `/api/stores/:storeId/templates` | List templates |
| POST | `/api/stores/:storeId/templates/:id/render` | Render template |

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- test/auth.spec.ts

# Run with coverage
pnpm test:cov
```

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `pnpm start:dev` | Start with hot reload |
| `pnpm build` | Compile TypeScript |
| `pnpm start:prod` | Run compiled code |
| `pnpm worker:start` | Start BullMQ workers |
| `pnpm lint` | Lint with ESLint |
| `pnpm test` | Run Jest tests |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate:dev` | Create and apply migration |
| `pnpm prisma:seed` | Seed database |

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.x (strict mode) |
| Framework | NestJS 10+ |
| ORM | Prisma 5+ |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7 (ioredis) |
| Validation | Zod + class-validator |
| Auth | Passport + JWT |
| API Docs | Swagger / OpenAPI |
| Containers | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Package Manager | pnpm |

## 📧 Email Verification

Merchants must verify their email before accessing protected routes:

1. **Register** → receive 6-digit verification code via email
2. **POST /api/auth/verify-email** → submit code to activate account
3. **POST /api/auth/resend-verification** → request a new code if expired

Unverified merchants receive `403 Forbidden` on protected endpoints.

## 🔑 Password Reset

1. **POST /api/auth/forgot-password** → receive reset link via email
2. **POST /api/auth/reset-password** → submit new password with token

Reset tokens expire after 1 hour. Tokens are bcrypt-hashed in the database.

## ⚡ Background Workers

Run workers separately from the main application:

```bash
pnpm worker:start
```

Workers process:
- **Email queue** — sends verification, password reset, order confirmation, and payment receipt emails
- **Abandoned cart queue** — marks stale carts as abandoned

Workers use BullMQ with Redis and include retry logic (3 attempts, exponential backoff).

## 🔒 Security Features

- JWT access + refresh tokens with rotation
- RBAC guards (merchant, super_admin, support)
- VerifiedGuard (blocks unverified users from protected routes)
- Rate limiting on all auth endpoints (Redis-backed token bucket)
- Password strength validation (min 8 chars, uppercase + digit)
- bcryptjs password hashing (cost 12)
- Token blacklisting on logout and refresh rotation
- HMAC-SHA256 webhook signatures

## 📁 Project Structure

```
src/
├── common/              # Shared infrastructure
│   ├── audit/           # Global audit interceptor & service
│   ├── decorators/      # Custom decorators (@Roles, @CurrentUser, @RateLimit, @Tenant)
│   ├── dto/             # Shared DTOs (pagination)
│   ├── filters/         # HTTP exception filters
│   ├── guards/          # JWT, Roles, Admin, Verified, Rate-limit guards
│   ├── interceptors/    # Logging, response transform
│   ├── middleware/       # Tenant middleware (search_path routing)
│   ├── pipes/           # Zod validation pipe
│   ├── queue/           # BullMQ queue module & service
│   ├── redis/           # Redis module & service
│   └── utils/           # Haversine, SKU builder, slugify, tiyin math
├── config/              # Environment config & validation
├── modules/             # 18 feature modules
│   ├── abandoned-carts/
│   ├── admin/
│   ├── analytics/
│   ├── auth/
│   ├── cart/
│   ├── checkout/
│   ├── customers/
│   ├── discounts/
│   ├── email/           # Nodemailer email service
│   ├── inventory/
│   ├── orders/
│   ├── payments/
│   ├── products/
│   ├── staff/
│   ├── storefront/
│   ├── stores/
│   ├── subscriptions/
│   ├── templates/
│   ├── warehouses/
│   └── webhooks/
├── prisma/              # Prisma service, module, middleware
└── workers/             # BullMQ workers & processors
    ├── processors/      # Email & abandoned cart processors
    └── *.worker.ts      # Worker stubs
```

## 📝 Environment Variables

See `.env.example` for all configuration options.

## 📄 License

University Final Project
