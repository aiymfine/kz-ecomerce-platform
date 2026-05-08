import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Attach request ID (use existing X-Request-ID header or generate one)
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-Id', requestId);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const logMethod = statusCode >= 400 ? 'warn' : statusCode >= 300 ? 'debug' : 'log';

          this.logger[logMethod](
            `[${requestId}] ${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent.substring(0, 80)}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${requestId}] ${method} ${url} - ${error.status || 500} ${duration}ms - ${ip}`,
          );
        },
      }),
    );
  }
}
