-- CreateEnum
CREATE TYPE "PlatformAdminRole" AS ENUM ('super_admin', 'support');

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('setup', 'active', 'suspended', 'closed');

-- CreateEnum
CREATE TYPE "StorePlan" AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('size', 'color', 'material');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('active', 'abandoned', 'converted');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('payment_pending', 'payment_failed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('choco', 'kazpost', 'self_pickup');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('kaspi_pay', 'halyk_bank', 'manual');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed_amount', 'free_shipping');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('pending', 'delivering', 'delivered', 'failed', 'dead_letter');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('weekly', 'bi_weekly', 'monthly');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled', 'dunning');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('inventory_manager', 'order_processor', 'analytics_viewer');

-- CreateEnum
CREATE TYPE "AbandonedCartStatus" AS ENUM ('pending', 'recovering', 'converted', 'expired');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('merchant', 'staff', 'customer');

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "PlatformAdminRole" NOT NULL DEFAULT 'support',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "business_name" VARCHAR(255),
    "status" "MerchantStatus" NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subdomain" VARCHAR(63) NOT NULL,
    "custom_domain" VARCHAR(255),
    "schema_name" VARCHAR(63) NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'setup',
    "plan" "StorePlan" NOT NULL DEFAULT 'free',
    "theme_id" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KZT',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Almaty',
    "vat_rate" INTEGER NOT NULL DEFAULT 12,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_records" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "amount_tiyin" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'pending',
    "provider_tx_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_log" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" INTEGER,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "session_id" VARCHAR(100),
    "user_agent" VARCHAR(500),
    "request_method" VARCHAR(10),
    "request_path" VARCHAR(500),
    "response_status" INTEGER,
    "duration_ms" INTEGER,
    "level" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_provisioning_log" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_provisioning_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "weight_grams" INTEGER NOT NULL DEFAULT 0,
    "allow_backorder" BOOLEAN NOT NULL DEFAULT false,
    "low_stock_alert" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(255),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "parent_id" INTEGER,
    "path" VARCHAR(500) NOT NULL DEFAULT '/',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_attributes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "AttributeType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_attribute_values" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variant_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "price_tiyin" INTEGER NOT NULL,
    "compare_at_price_tiyin" INTEGER,
    "barcode" VARCHAR(50),
    "weight_grams" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "phone" VARCHAR(20),
    "is_first_buyer" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "label" VARCHAR(50),
    "full_name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" VARCHAR(30) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'payment_pending',
    "subtotal_tiyin" INTEGER NOT NULL,
    "discount_tiyin" INTEGER NOT NULL DEFAULT 0,
    "shipping_tiyin" INTEGER NOT NULL DEFAULT 0,
    "vat_tiyin" INTEGER NOT NULL DEFAULT 0,
    "total_tiyin" INTEGER NOT NULL,
    "shipping_method" "ShippingMethod",
    "shipping_address" JSONB,
    "customer_note" VARCHAR(500),
    "notes" TEXT,
    "idempotency_key" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "product_title" VARCHAR(200) NOT NULL,
    "variant_sku" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_tiyin" INTEGER NOT NULL,
    "total_price_tiyin" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_tx_id" VARCHAR(255),
    "amount_tiyin" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "idempotency_key" VARCHAR(100) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fulfillments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "tracking_number" VARCHAR(100),
    "shipped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "min_order_tiyin" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "max_per_customer" INTEGER NOT NULL DEFAULT 1,
    "is_stackable" BOOLEAN NOT NULL DEFAULT false,
    "first_buyer_only" BOOLEAN NOT NULL DEFAULT false,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_discounts" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "promo_code_id" INTEGER,
    "discount_tiyin" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,

    CONSTRAINT "order_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "secret" VARCHAR(64) NOT NULL,
    "events" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" SERIAL NOT NULL,
    "webhook_id" INTEGER NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMP(3),
    "last_response_code" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_boxes" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price_tiyin" INTEGER NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "max_skip_consecutive" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_box_items" (
    "id" SERIAL NOT NULL,
    "box_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subscription_box_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_orders" (
    "id" SERIAL NOT NULL,
    "box_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "cycle_number" INTEGER NOT NULL DEFAULT 0,
    "amount_tiyin" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_attempts" INTEGER NOT NULL DEFAULT 0,
    "consecutive_skips" INTEGER NOT NULL DEFAULT 0,
    "next_billing_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "role" "StaffRole" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "template_content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abandoned_carts" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "cart_snapshot" JSONB NOT NULL,
    "recovery_code" VARCHAR(64) NOT NULL,
    "discount_code" VARCHAR(30),
    "discount_tiyin" INTEGER NOT NULL DEFAULT 0,
    "emails_sent" INTEGER NOT NULL DEFAULT 0,
    "status" "AbandonedCartStatus" NOT NULL DEFAULT 'pending',
    "last_email_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_audit_log" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "actor_type" "ActorType" NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" INTEGER,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "session_id" VARCHAR(100),
    "user_agent" VARCHAR(500),
    "request_method" VARCHAR(10),
    "request_path" VARCHAR(500),
    "response_status" INTEGER,
    "duration_ms" INTEGER,
    "level" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_subdomain_key" ON "stores"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "stores_custom_domain_key" ON "stores"("custom_domain");

-- CreateIndex
CREATE UNIQUE INDEX "stores_schema_name_key" ON "stores"("schema_name");

-- CreateIndex
CREATE INDEX "ix_stores_merchant_id" ON "stores"("merchant_id");

-- CreateIndex
CREATE INDEX "ix_stores_subdomain" ON "stores"("subdomain");

-- CreateIndex
CREATE INDEX "ix_stores_theme_id" ON "stores"("theme_id");

-- CreateIndex
CREATE INDEX "ix_billing_store_id" ON "billing_records"("store_id");

-- CreateIndex
CREATE INDEX "ix_audit_created_at" ON "platform_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "ix_platform_audit_resource" ON "platform_audit_log"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "ix_platform_audit_action" ON "platform_audit_log"("action");

-- CreateIndex
CREATE INDEX "ix_platform_audit_level" ON "platform_audit_log"("level", "created_at");

-- CreateIndex
CREATE INDEX "ix_tenant_prov_store_id" ON "tenant_provisioning_log"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_image_position" ON "product_images"("product_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_category" ON "product_categories"("product_id", "category_id");

-- CreateIndex
CREATE INDEX "variant_attributes_type_idx" ON "variant_attributes"("type");

-- CreateIndex
CREATE INDEX "variant_attribute_values_variant_id_idx" ON "variant_attribute_values"("variant_id");

-- CreateIndex
CREATE INDEX "variant_attribute_values_attribute_id_idx" ON "variant_attribute_values"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_variant_attribute" ON "variant_attribute_values"("variant_id", "attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "warehouses_city_idx" ON "warehouses"("city");

-- CreateIndex
CREATE INDEX "ix_inventory_available" ON "inventory"("quantity_available");

-- CreateIndex
CREATE UNIQUE INDEX "uq_variant_warehouse" ON "inventory"("variant_id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "addresses_customer_id_idx" ON "addresses"("customer_id");

-- CreateIndex
CREATE INDEX "carts_customer_id_idx" ON "carts"("customer_id");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "ix_orders_status_created" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "ix_orders_customer" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "ix_payments_order" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "ix_payments_idempotency" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "order_fulfillments_order_id_idx" ON "order_fulfillments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "ix_promo_code_active" ON "promo_codes"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "order_discounts_order_id_idx" ON "order_discounts"("order_id");

-- CreateIndex
CREATE INDEX "ix_webhook_events_status" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "ix_webhook_events_retry" ON "webhook_events"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "webhook_events_webhook_id_idx" ON "webhook_events"("webhook_id");

-- CreateIndex
CREATE INDEX "subscription_boxes_billingCycle_idx" ON "subscription_boxes"("billingCycle");

-- CreateIndex
CREATE INDEX "subscription_box_items_box_id_idx" ON "subscription_box_items"("box_id");

-- CreateIndex
CREATE INDEX "ix_sub_orders_status_next" ON "subscription_orders"("status", "next_billing_at");

-- CreateIndex
CREATE INDEX "subscription_orders_customer_id_idx" ON "subscription_orders"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_email_key" ON "staff_members"("email");

-- CreateIndex
CREATE INDEX "staff_members_role_idx" ON "staff_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "abandoned_carts_recovery_code_key" ON "abandoned_carts"("recovery_code");

-- CreateIndex
CREATE INDEX "abandoned_carts_customer_id_idx" ON "abandoned_carts"("customer_id");

-- CreateIndex
CREATE INDEX "ix_abandoned_status_expires" ON "abandoned_carts"("status", "expires_at");

-- CreateIndex
CREATE INDEX "ix_store_audit_created" ON "store_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "ix_store_audit_actor" ON "store_audit_log"("actor_id", "actor_type");

-- CreateIndex
CREATE INDEX "ix_store_audit_resource" ON "store_audit_log"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "ix_store_audit_action" ON "store_audit_log"("action");

-- CreateIndex
CREATE INDEX "ix_store_audit_level" ON "store_audit_log"("level", "created_at");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_audit_log" ADD CONSTRAINT "platform_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "variant_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_box_items" ADD CONSTRAINT "subscription_box_items_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "subscription_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_orders" ADD CONSTRAINT "subscription_orders_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "subscription_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
