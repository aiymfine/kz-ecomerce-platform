import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no rate limit metadata, allow through
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const ip =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      'unknown';

    const key = `${options.keyPrefix}:${ip}`;
    const result = await this.redisService.rateLimit(
      key,
      options.limit,
      options.windowSeconds,
    );

    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', options.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: 429,
          error: 'TOO_MANY_REQUESTS',
          message: 'Too many requests, please try again later',
          retryAfter: result.resetAt - Math.floor(Date.now() / 1000),
        },
        429,
      );
    }

    return true;
  }
}
