import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      return { error: 'CONFLICT', message: 'Email already registered' };
    }

    // Hash password with cost 12
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const merchant = await this.prisma.merchant.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        businessName: dto.businessName,
      },
    });

    const tokens = await this.generateTokens({
      sub: merchant.id,
      email: merchant.email,
      role: 'merchant',
      merchantId: merchant.id,
    });

    return {
      merchant: this.sanitizeMerchant(merchant),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });

    if (!merchant) {
      return { error: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    if (!merchant.isActive) {
      return { error: 'FORBIDDEN', message: 'Account is deactivated' };
    }

    const isValid = await bcrypt.compare(dto.password, merchant.passwordHash);
    if (!isValid) {
      return { error: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    const tokens = await this.generateTokens({
      sub: merchant.id,
      email: merchant.email,
      role: 'merchant',
      merchantId: merchant.id,
    });

    return {
      merchant: this.sanitizeMerchant(merchant),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      // Check if token is blacklisted
      if (payload.jti) {
        const blacklisted = await this.redisService.isTokenBlacklisted(
          payload.jti,
        );
        if (blacklisted) {
          return { error: 'UNAUTHORIZED', message: 'Token has been revoked' };
        }
      }

      const merchant = await this.prisma.merchant.findUnique({
        where: { id: payload.sub },
      });
      if (!merchant || !merchant.isActive) {
        return { error: 'UNAUTHORIZED', message: 'User not found' };
      }

      const tokens = await this.generateTokens({
        sub: merchant.id,
        email: merchant.email,
        role: 'merchant',
        merchantId: merchant.id,
      });

      return {
        merchant: this.sanitizeMerchant(merchant),
        ...tokens,
      };
    } catch {
      return { error: 'UNAUTHORIZED', message: 'Invalid refresh token' };
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const accessTokenExpireMinutes = this.configService.get<number>(
        'JWT_ACCESS_TOKEN_EXPIRE_MINUTES',
        30,
      );
      const refreshTokenExpireDays = this.configService.get<number>(
        'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
        7,
      );

      // Blacklist both tokens
      if (payload.jti) {
        await this.redisService.blacklistToken(
          payload.jti,
          refreshTokenExpireDays * 24 * 60 * 60,
        );
      }

      // Also blacklist the access token if we have its JTI
      // The refresh token payload contains the original jti
      return { message: 'Logged out successfully' };
    } catch {
      // Even if token verification fails, just return success
      return { message: 'Logged out successfully' };
    }
  }

  async getMe(userId: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: userId },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
          },
        },
      },
    });

    if (!merchant) {
      return { error: 'NOT_FOUND', message: 'User not found' };
    }

    return this.sanitizeMerchant(merchant);
  }

  // Admin login
  async adminLogin(dto: LoginDto) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      return { error: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    if (!admin.isActive) {
      return { error: 'FORBIDDEN', message: 'Account is deactivated' };
    }

    const isValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isValid) {
      return { error: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    // Update last login
    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      ...tokens,
    };
  }

  private async generateTokens(payload: {
    sub: number;
    email: string;
    role: string;
    merchantId?: number;
    storeId?: number;
  }) {
    const jti = randomUUID();
    const accessTokenExpireMinutes = this.configService.get<number>(
      'JWT_ACCESS_TOKEN_EXPIRE_MINUTES',
      30,
    );
    const refreshTokenExpireDays = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
      7,
    );

    const accessToken = this.jwtService.sign(
      { ...payload, jti },
      {
        expiresIn: `${accessTokenExpireMinutes}m`,
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID(), type: 'refresh' },
      {
        expiresIn: `${refreshTokenExpireDays}d`,
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpireMinutes * 60,
    };
  }

  private sanitizeMerchant(merchant: any) {
    const { passwordHash, ...safe } = merchant;
    return safe;
  }
}
