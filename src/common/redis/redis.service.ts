import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null = null;
  private readonly prefix: string;
  private readonly available: boolean;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.prefix = 'shopbuilder:';
    this.available = !!redisUrl;

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not set — Redis features (rate limiting, token blacklist) are disabled',
      );
      return;
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 5000);
      },
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Disconnected from Redis');
    }
  }

  private key(key: string): string {
    return `${this.prefix}${key}`;
  }

  private ensure(): Redis {
    if (!this.client) throw new Error('Redis not configured');
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(this.key(key));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setex(this.key(key), ttlSeconds, value);
    } else {
      await this.client.set(this.key(key), value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(this.key(key));
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(this.key(key));
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.ttl(this.key(key));
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(this.key(key));
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(this.key(key), seconds);
  }

  /**
   * Token bucket rate limiter.
   * Returns true if the request is allowed, false if rate limited.
   */
  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const fullKey = `ratelimit:${key}`;
    const current = await this.incr(fullKey);
    const now = Math.floor(Date.now() / 1000);

    if (current === 1) {
      await this.expire(fullKey, windowSeconds);
    }

    const ttl = await this.ttl(fullKey);
    const resetAt = now + (ttl > 0 ? ttl : windowSeconds);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  }

  /**
   * Blacklist a token (for logout).
   */
  async blacklistToken(jti: string, expireSeconds: number): Promise<void> {
    await this.set(`blacklist:${jti}`, '1', expireSeconds);
  }

  /**
   * Check if a token is blacklisted.
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.exists(`blacklist:${jti}`);
  }

  getClient(): Redis | null {
    return this.client;
  }
}
