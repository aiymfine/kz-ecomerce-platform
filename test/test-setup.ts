// Global test setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shopbuilder_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET_KEY =
  process.env.JWT_SECRET_KEY || 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
process.env.CORS_ORIGINS = 'http://localhost:3000';

jest.setTimeout(30000);

// Wait for Redis to be reachable before tests start
beforeAll(async () => {
  const { default: Redis } = await import('ioredis');
  const client = new Redis(process.env.REDIS_URL!, { lazyConnect: true, maxRetriesPerRequest: 3 });

  for (let i = 0; i < 10; i++) {
    try {
      await client.connect();
      await client.ping();
      client.disconnect();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  client.disconnect();
}, 30000);

// Helper to create a fully configured test app (same as main.ts bootstrap)
export async function createTestApp() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');
  const { ValidationPipe } = await import('@nestjs/common');
  const { HttpExceptionFilter } = await import('../src/common/filters/http-exception.filter');
  const { TransformInterceptor } = await import('../src/common/interceptors/transform.interceptor');
  const { LoggingInterceptor } = await import('../src/common/interceptors/logging.interceptor');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.init();

  return app;
}
