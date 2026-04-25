import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const logMethod = statusCode >= 400 ? 'warn' : statusCode >= 300 ? 'debug' : 'log';

          this.logger[logMethod](
            `${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent.substring(0, 80)}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`${method} ${url} - ${error.status || 500} ${duration}ms - ${ip}`);
        },
      }),
    );
  }
}
