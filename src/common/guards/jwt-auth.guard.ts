import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  storeId?: number;
  merchantId?: number;
  emailVerified?: boolean;
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
      throw new UnauthorizedException('Authorization header is required');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Check if token is blacklisted
      if (payload.jti) {
        const isBlacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
        if (isBlacklisted) {
          return false;
        }
      }

      // Block unverified merchants from protected routes
      // Skip for AuthController (login, logout, verify, refresh still need to work)
      // Skip for admin tokens (emailVerified is always true for admins)
      if (payload.emailVerified === false) {
        const controllerClass = context.getClass().name;
        if (controllerClass !== 'AuthController') {
          throw new ForbiddenException('Please verify your email before accessing this resource');
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
