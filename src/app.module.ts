import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StaffModule } from './modules/staff/staff.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    AdminModule,
    StoresModule,
    ProductsModule,
    WebhooksModule,
    StaffModule,
    WarehousesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
