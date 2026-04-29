# ShopBuilder — Shopify Clone for Local Kazakh Merchants

E-commerce platform built with **NestJS 10**, **TypeScript 5**, **Prisma 5**, **PostgreSQL 15**, and **Redis 7**.

## Architecture

- **Multi-tenancy**: Schema-per-tenant with `search_path` middleware
- **Auth**: JWT access (30min) + refresh (7d) tokens, bcryptjs hashing
- **Validation**: Zod schemas bridged to NestJS pipes
- **Rate limiting**: Redis token bucket (5 req/min on auth endpoints)
- **Audit logging**: Global interceptor captures all state-changing requests
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

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register merchant |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current merchant profile |
| POST | `/api/auth/admin/login` | Admin login |

#### Platform Admin
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

#### Stores
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | List merchant's stores |
| POST | `/api/stores` | Create store |
| GET | `/api/stores/:id` | Store details |
| PATCH | `/api/stores/:id` | Update store |

#### Products & Categories
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

#### Warehouses & Inventory
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

#### Orders & Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/orders` | List orders |
| GET | `/api/stores/:storeId/orders/:orderNumber` | Order details |
| PATCH | `/api/stores/:storeId/orders/:id/status` | Update order status |
| POST | `/api/stores/:storeId/orders/:id/fulfill` | Create fulfillment |
| PATCH | `/api/stores/:storeId/orders/:id/fulfillments/:fulfillmentId` | Update fulfillment |

#### Payments & Discounts
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

#### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/cart` | Get/create cart |
| POST | `/api/stores/:storeId/cart/items` | Add item to cart |
| PATCH | `/api/stores/:storeId/cart/items/:id` | Update item quantity |
| DELETE | `/api/stores/:storeId/cart/items/:id` | Remove item |
| DELETE | `/api/stores/:storeId/cart` | Clear cart |

#### Customers & Storefront
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

#### Webhooks, Staff, Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/webhooks` | List webhooks |
| POST | `/api/stores/:storeId/webhooks` | Create webhook |
| GET | `/api/stores/:storeId/staff` | List staff |
| POST | `/api/stores/:storeId/staff` | Invite staff |
| POST | `/api/stores/:storeId/subscription-boxes` | Create subscription box |
| POST | `/api/stores/:storeId/subscriptions/subscribe` | Subscribe to box |

#### Analytics & Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores/:storeId/analytics/sales` | Sales dashboard |
| GET | `/api/stores/:storeId/analytics/products` | Product performance |
| GET | `/api/stores/:storeId/analytics/customers` | Customer analytics |
| GET | `/api/stores/:storeId/analytics/inventory` | Inventory status |
| GET | `/api/stores/:storeId/templates` | List templates |
| POST | `/api/stores/:storeId/templates/:id/render` | Render template |

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
| `pnpm worker:start` | Start BullMQ workers |
| `pnpm lint` | Lint with ESLint |
| `pnpm test` | Run Jest tests |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate:dev` | Create and apply migration |
| `pnpm prisma:seed` | Seed database |

## Environment Variables

See `.env.example` for all configuration options.

## License

University Final Project
