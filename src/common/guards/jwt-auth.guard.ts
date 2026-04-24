import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  storeId?: number;
  merchantId?: number;
  jti?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Check if token is blacklisted
      if (payload.jti) {
        const isBlacklisted = await this.redisService.isTokenBlacklisted(
          payload.jti,
        );
        if (isBlacklisted) {
          return false;
        }
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        return false;
      }
      throw error;
    }
  }
}
