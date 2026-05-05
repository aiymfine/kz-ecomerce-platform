import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('Bootstrap');

function validateEnv() {
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') return;

  const required = ['DATABASE_URL', 'JWT_SECRET_KEY', 'SMTP_HOST'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Application cannot start without these variables.');
    process.exit(1);
  }
}

async function bootstrap() {
  // Validate required environment variables before starting the app
  validateEnv();

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
    .addTag('Customers', 'Customer profile and address management')
    .addTag('Storefront', 'Public storefront API and customer auth')
    .addTag('Cart', 'Shopping cart management')
    .addTag('Orders', 'Order management and fulfillment')
    .addTag('Inventory', 'Warehouse and stock management')
    .addTag('Payments', 'Payment processing and refunds')
    .addTag('Discounts', 'Promo codes and discount validation')
    .addTag('Subscriptions', 'Subscription boxes and billing')
    .addTag('Abandoned Carts', 'Cart recovery management')
    .addTag('Analytics', 'Sales, product, and customer analytics')
    .addTag('Templates', 'Theme template management and rendering')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Export OpenAPI specs
  const specDir = path.resolve(process.cwd());
  fs.writeFileSync(
    path.join(specDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );

  // Export YAML (simple conversion)
  const yaml = jsonToYaml(document);
  fs.writeFileSync(path.join(specDir, 'openapi.yaml'), yaml);

  await app.listen(port);
  logger.log(`🚀 ShopBuilder API running on http://localhost:${port}`);
  logger.log(`📚 API Docs available at http://localhost:${port}/docs`);
}

function jsonToYaml(obj: any, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  let result = '';

  if (obj === null || obj === undefined) {
    return 'null\n';
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true\n' : 'false\n';
  }

  if (typeof obj === 'number') {
    return `${obj}\n`;
  }

  if (typeof obj === 'string') {
    // Handle multi-line strings
    if (obj.includes('\n')) {
      return `|\n${obj
        .split('\n')
        .map((line) => pad + '  ' + line)
        .join('\n')}\n`;
    }
    // Quote strings that need it
    if (
      obj === '' ||
      obj.includes(':') ||
      obj.includes('#') ||
      obj.includes('{') ||
      obj.includes('}') ||
      obj.includes('[') ||
      obj.includes(']') ||
      obj.includes(',') ||
      obj.includes('&') ||
      obj.includes('*') ||
      obj.includes('?') ||
      obj.includes('|') ||
      obj.includes('<') ||
      obj.includes('>') ||
      obj.includes('=') ||
      obj.includes('!') ||
      obj.includes('%') ||
      obj.includes('@') ||
      obj.includes('`') ||
      obj.includes('"') ||
      obj.includes("'") ||
      obj.startsWith(' ') ||
      obj.endsWith(' ') ||
      obj === 'true' ||
      obj === 'false' ||
      obj === 'null' ||
      !isNaN(Number(obj))
    ) {
      // Use double quotes, escape internal quotes
      return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"\n`;
    }
    return `${obj}\n`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]\n';
    }
    for (const item of obj) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length === 0) {
          result += `${pad}- {}\n`;
        } else {
          const firstKey = keys[0];
          const firstVal = item[firstKey];
          if (typeof firstVal !== 'object' || firstVal === null) {
            result += `${pad}- ${firstKey}: ${jsonToYaml(firstVal, 0).trimEnd()}\n`;
            for (let i = 1; i < keys.length; i++) {
              const key = keys[i];
              const val = item[key];
              if (typeof val === 'object' && val !== null) {
                result += `${pad}  ${key}:\n${jsonToYaml(val, indent + 2)}`;
              } else {
                result += `${pad}  ${key}: ${jsonToYaml(val, 0).trimEnd()}\n`;
              }
            }
          } else {
            result += `${pad}- ${firstKey}:\n${jsonToYaml(firstVal, indent + 2)}`;
            for (let i = 1; i < keys.length; i++) {
              const key = keys[i];
              const val = item[key];
              if (typeof val === 'object' && val !== null) {
                result += `${pad}  ${key}:\n${jsonToYaml(val, indent + 2)}`;
              } else {
                result += `${pad}  ${key}: ${jsonToYaml(val, 0).trimEnd()}\n`;
              }
            }
          }
        }
      } else {
        result += `${pad}- ${jsonToYaml(item, indent + 1).trimEnd()}\n`;
      }
    }
    return result;
  }

  // Object
  const keys = Object.keys(obj);
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const inner = jsonToYaml(val, indent + 1);
      if (inner.trim() === '{}') {
        result += `${pad}${key}: {}\n`;
      } else {
        result += `${pad}${key}:\n${inner}`;
      }
    } else {
      result += `${pad}${key}: ${jsonToYaml(val, 0).trimEnd()}\n`;
    }
  }

  return result;
}

bootstrap();
