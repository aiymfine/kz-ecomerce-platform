import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method } = request;

    // Skip non-state-changing methods
    if (!STATE_CHANGING_METHODS.has(method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const path = request.path;
    const body = request.body;
    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.get('user-agent') || '';

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const user = (request as any).user;
          const actorId = user?.sub ?? user?.id ?? null;
          const actorType = (user?.role as any) ?? 'merchant';

          const action = this.computeAction(method, path);
          const resourceType = this.extractResourceType(path);
          const resourceId = this.extractResourceId(path);

          const level = this.determineLevel(method, path, statusCode);

          this.auditService.log({
            actorId,
            actorType,
            action,
            resourceType,
            resourceId,
            changes: body ? { after: body } : null,
            ipAddress: ip,
            userAgent,
            requestMethod: method,
            requestPath: path,
            responseStatus: statusCode,
            durationMs: duration,
            level,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const user = (request as any).user;

          this.auditService.log({
            actorId: user?.sub ?? user?.id ?? null,
            actorType: (user?.role as any) ?? 'merchant',
            action: this.computeAction(method, path),
            resourceType: this.extractResourceType(path),
            resourceId: this.extractResourceId(path),
            changes: body ? { after: body } : null,
            ipAddress: ip,
            userAgent,
            requestMethod: method,
            requestPath: path,
            responseStatus: error.status ?? 500,
            durationMs: duration,
            level: 'ERROR',
          });
        },
      }),
    );
  }

  private computeAction(method: string, path: string): string {
    const methodMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    const verb = methodMap[method] || method;
    const resource = this.extractResourceType(path);
    return `${verb}_${resource.toUpperCase()}`;
  }

  private extractResourceType(path: string): string {
    // Strip /api prefix and get the first meaningful segment
    const cleaned = path.replace(/^\/api\//, '').replace(/^\d+\//, '');
    const segments = cleaned.split('/').filter(Boolean);
    return segments[0] || 'unknown';
  }

  private extractResourceId(path: string): number | null {
    const match = path.match(/\/(\d+)(?:\/|$)/);
    if (match) {
      const id = parseInt(match[1], 10);
      return isNaN(id) ? null : id;
    }
    return null;
  }

  private determineLevel(
    method: string,
    path: string,
    statusCode: number,
  ): string {
    if (method === 'DELETE' || path.toLowerCase().includes('refund')) {
      return 'CRITICAL';
    }
    if (statusCode >= 400) {
      return 'WARN';
    }
    return 'INFO';
  }
}
