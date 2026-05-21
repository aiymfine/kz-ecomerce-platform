import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefixes and pipes
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Swagger — set up BEFORE static serving so it doesn't get intercepted
  const config = new DocumentBuilder()
    .setTitle('ShopBuilder KZ API')
    .setDescription('Multi-tenant e-commerce platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Serve frontend static files (if they exist — Docker production only)
  const frontendPath = path.join(__dirname, '..', 'public');
  if (fs.existsSync(frontendPath) && fs.readdirSync(frontendPath).length > 0) {
    app.use(express.static(frontendPath));
    // SPA fallback: serve index.html for non-API routes
    app.use('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.originalUrl.startsWith('/api')) return next();
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    console.log('📦 Serving frontend from /public');
  }

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
