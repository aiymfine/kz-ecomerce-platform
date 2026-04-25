import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const origins = corsOrigins.split(',').map((o) => o.trim());
  app.enableCors({
    origin: nodeEnv === 'production' ? origins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Zod handles validation
      transform: true,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ShopBuilder API')
    .setDescription(
      'ShopBuilder — Shopify Clone for Local Kazakh Merchants. E-commerce platform API.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Merchant registration, login, token management')
    .addTag('Admin', 'Platform administration endpoints')
    .addTag('Stores', 'Store management and tenant provisioning')
    .addTag('Products', 'Product catalog and variant management')
    .addTag('Categories', 'Category tree with materialized path')
    .addTag('Webhooks', 'Webhook registration and event delivery log')
    .addTag('Staff', 'Staff invitation and management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`🚀 ShopBuilder API running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/docs`);
}

bootstrap();
