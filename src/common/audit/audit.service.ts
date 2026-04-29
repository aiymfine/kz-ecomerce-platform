import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEntryDto, auditEntrySchema } from './dto/audit-entry.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntryDto) {
    const parsed = auditEntrySchema.safeParse(entry);
    if (!parsed.success) {
      this.logger.warn(`Invalid audit entry: ${parsed.error.message}`);
      return;
    }

    try {
      await this.prisma.storeAuditLog.create({
        data: {
          actorId: parsed.data.actorId,
          actorType: parsed.data.actorType,
          action: parsed.data.action,
          resourceType: parsed.data.resourceType,
          resourceId: parsed.data.resourceId,
          changes: parsed.data.changes ?? undefined,
          ipAddress: parsed.data.ipAddress ?? undefined,
          userAgent: parsed.data.userAgent ?? undefined,
          requestMethod: parsed.data.requestMethod ?? undefined,
          requestPath: parsed.data.requestPath ?? undefined,
          responseStatus: parsed.data.responseStatus ?? undefined,
          durationMs: parsed.data.durationMs ?? undefined,
          level: parsed.data.level,
        },
      });
    } catch (error: unknown) {
      // Don't let audit logging break the request
      this.logger.error(`Failed to write audit log: ${(error as Error).message}`);
    }
  }
}
