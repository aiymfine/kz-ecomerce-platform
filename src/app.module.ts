import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queue/queue.module';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StaffModule } from './modules/staff/staff.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { CustomersModule } from './modules/customers/customers.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AbandonedCartsModule } from './modules/abandoned-carts/abandoned-carts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { AuditModule } from './common/audit/audit.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    EmailModule,
    AuditModule,
    AuthModule,
    AdminModule,
    StoresModule,
    ProductsModule,
    WebhooksModule,
    StaffModule,
    WarehousesModule,
    CustomersModule,
    StorefrontModule,
    CartModule,
    OrdersModule,
    InventoryModule,
    PaymentsModule,
    DiscountsModule,
    CheckoutModule,
    SubscriptionsModule,
    AbandonedCartsModule,
    AnalyticsModule,
    TemplatesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
