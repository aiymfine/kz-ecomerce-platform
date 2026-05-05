import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { QueueService } from '../../common/queue/queue.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID, randomInt } from 'crypto';
import {
  RegisterDto,
  LoginDto,
} from './dto/auth.dto';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private queueService: QueueService,
  ) {}

  private validatePasswordStrength(password: string): string | null {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
    return null;
  }

  private generateVerificationCode(): string {
    return String(randomInt(100000, 999999));
  }

  async register(dto: RegisterDto) {
    // Validate password strength
    const passwordError = this.validatePasswordStrength(dto.password);
    if (passwordError) {
      return { error: 'WEAK_PASSWORD', message: passwordError };
    }

    // Check if email already exists
    const existing = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      return { error: 'CONFLICT', message: 'Email already registered' };
    }

    // Hash password with cost 12
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const merchant = await this.prisma.merchant.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        businessName: dto.businessName,
        verificationCode,
        verificationCodeExpiresAt,
      },
    });

    const tokens = await this.generateTokens({
      sub: merchant.id,
      email: merchant.email,
      role: 'merchant',
      merchantId: merchant.id,
      emailVerified: false,
    });

    // Enqueue verification email
    try {
      await this.queueService.enqueueEmail({
        type: 'verification',
        to: merchant.email,
        data: { code: verificationCode },
      });
    } catch {
      // Non-blocking — queue may not be available
    }

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
      emailVerified: merchant.emailVerified,
    });

    return {
      merchant: this.sanitizeMerchant(merchant),
      ...tokens,
    };
  }

  async verifyEmail(email: string, code: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email },
    });

    if (!merchant) {
      return { error: 'NOT_FOUND', message: 'User not found' };
    }

    if (merchant.emailVerified) {
      return { message: 'Email is already verified' };
    }

    if (
      !merchant.verificationCode ||
      merchant.verificationCode !== code ||
      !merchant.verificationCodeExpiresAt ||
      merchant.verificationCodeExpiresAt < new Date()
    ) {
      return { error: 'BAD_REQUEST', message: 'Invalid or expired verification code' };
    }

    await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email },
    });

    if (!merchant) {
      return { error: 'NOT_FOUND', message: 'User not found' };
    }

    if (merchant.emailVerified) {
      return { error: 'BAD_REQUEST', message: 'Email is already verified' };
    }

    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt,
      },
    });

    try {
      await this.queueService.enqueueEmail({
        type: 'verification',
        to: merchant.email,
        data: { code: verificationCode },
      });
    } catch {
      // Non-blocking
    }

    return { message: 'Verification code sent' };
  }

  async forgotPassword(email: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!merchant) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = randomUUID();
    const hashedToken = await bcrypt.hash(token, 10);
    const resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt,
      },
    });

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3001');
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    try {
      await this.queueService.enqueueEmail({
        type: 'password-reset',
        to: merchant.email,
        data: { resetLink },
      });
    } catch {
      // Non-blocking
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Validate password strength
    const passwordError = this.validatePasswordStrength(newPassword);
    if (passwordError) {
      return { error: 'WEAK_PASSWORD', message: passwordError };
    }

    // Find merchant by checking all merchants with a reset token
    // We need to iterate because the token is hashed
    const merchants = await this.prisma.merchant.findMany({
      where: {
        resetPasswordToken: { not: null },
        resetPasswordExpiresAt: { gte: new Date() },
      },
    });

    let matchedMerchant: typeof merchants[0] | null = null;
    for (const merchant of merchants) {
      const isValid = await bcrypt.compare(token, merchant.resetPasswordToken!);
      if (isValid) {
        matchedMerchant = merchant;
        break;
      }
    }

    if (!matchedMerchant) {
      return { error: 'BAD_REQUEST', message: 'Invalid or expired reset token' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.merchant.update({
      where: { id: matchedMerchant.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    // Blacklist all existing tokens for this user
    const refreshTokenExpireDays = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
      7,
    );
    await this.redisService.blacklistToken(
      `user:${matchedMerchant.id}:all`,
      refreshTokenExpireDays * 24 * 60 * 60,
    );

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        return { error: 'UNAUTHORIZED', message: 'Not a refresh token' };
      }

      // Check if token is blacklisted (rotation: each refresh token used once)
      if (payload.jti) {
        const blacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
        if (blacklisted) {
          return { error: 'UNAUTHORIZED', message: 'Token has been revoked (reuse detected)' };
        }
      }

      const merchant = await this.prisma.merchant.findUnique({
        where: { id: payload.sub },
      });
      if (!merchant || !merchant.isActive) {
        return { error: 'UNAUTHORIZED', message: 'User not found' };
      }

      // Refresh token rotation: blacklist the old refresh token
      if (payload.jti) {
        const refreshTokenExpireDays = this.configService.get<number>(
          'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
          7,
        );
        await this.redisService.blacklistToken(
          payload.jti,
          refreshTokenExpireDays * 24 * 60 * 60,
        );
      }

      const tokens = await this.generateTokens({
        sub: merchant.id,
        email: merchant.email,
        role: 'merchant',
        merchantId: merchant.id,
        emailVerified: merchant.emailVerified,
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
      const refreshTokenExpireDays = this.configService.get<number>(
        'JWT_REFRESH_TOKEN_EXPIRE_DAYS',
        7,
      );

      // Blacklist both tokens
      if (payload.jti) {
        await this.redisService.blacklistToken(payload.jti, refreshTokenExpireDays * 24 * 60 * 60);
      }

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
      emailVerified: true,
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
    emailVerified?: boolean;
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
    const { passwordHash, verificationCode, verificationCodeExpiresAt, resetPasswordToken, resetPasswordExpiresAt, ...safe } = merchant;
    return safe;
  }
}
