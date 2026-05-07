// Async Audit Log Writer Worker
// Queue: audit:write
// Job data: { actorId, actorType, action, resourceType, resourceId, changes, ipAddress, userAgent, requestMethod, requestPath, responseStatus, durationMs, level }
//
// When BullMQ is installed, this will be registered as:
//   new Worker('audit:write', processor, { connection: redis })
//
// For now, this is a stub. Audit logs are written synchronously via AuditService.

export class AuditWorker {
  async process(job: Record<string, any>) {
    console.log(`[AuditWorker] Would write audit log: ${job.action} ${job.resourceType}`);
    // TODO: Insert StoreAuditLog record via Prisma
    // TODO: Retry on DB connection failure
  }
}

export function startAuditWorker() {
  console.log('[AuditWorker] Stub started — awaiting BullMQ integration');
}
