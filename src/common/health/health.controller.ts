import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check — verify service dependencies' })
  async check() {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Database check
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Redis check
    try {
      const start = Date.now();
      const redisClient = this.redis.getClient();
      if (redisClient) {
        await redisClient.ping();
        checks.redis = { status: 'ok', latencyMs: Date.now() - start };
      } else {
        checks.redis = { status: 'degraded', error: 'Redis not configured' };
      }
    } catch (error) {
      checks.redis = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };
  }
}
