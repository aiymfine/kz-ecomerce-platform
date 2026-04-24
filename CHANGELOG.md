# CHANGELOG

All notable changes to the ShopBuilder API will be documented in this file.

## [1.0.0] - Sprint 1

### Added
- Authentication system (register, login, logout, refresh, /me)
- JWT access tokens (30min) and refresh tokens (7 days)
- RBAC with merchant, super_admin, support roles
- Rate limiting (5 req/min) on auth endpoints via Redis token bucket
- Platform admin module (merchants, stores, analytics, audit-log)
- Store management with schema-per-tenant multi-tenancy
- Product CRUD with cursor-based pagination
- Product variant matrix (Size × Color × Material SKU generation)
- Category tree with materialized path (path, depth columns)
- Webhook CRUD with HMAC secret generation
- Webhook event delivery log (retry_count, exponential backoff columns)
- Staff management (invite, update role, remove)
- Global exception filter (standardized error responses)
- Response transform interceptor ({data, meta} envelope)
- Swagger UI at /docs
- Docker support (Dockerfile + docker-compose.yml)
- CI/CD pipeline (.github/workflows/ci.yml)
- Seed script with test data (admin, 2 merchants, stores, products)
- Zod validation on all request DTOs

### Deviations from Blueprint
- Tenant tables created via `CREATE TABLE ... LIKE` with `ALTER COLUMN updated_at SET DEFAULT NOW()` because Prisma's `@updatedAt` does not add a database-level default, which is needed for raw SQL operations.
- Seed script uses `DROP SCHEMA IF EXISTS ... CASCADE` + `CREATE SCHEMA` instead of checking for existing schemas, to ensure clean state on every seed run.
- Warehouse CRUD endpoints deferred to Sprint 2 (warehouse tables exist in schema, controller not yet implemented).
