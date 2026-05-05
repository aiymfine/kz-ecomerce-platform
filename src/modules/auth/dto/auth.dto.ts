import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().max(20).optional(),
  businessName: z.string().max(255).optional(),
});

export class RegisterDto {
  @ApiProperty({ example: 'merchant@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'TestPassword123!', description: 'Min 8 chars, uppercase + digit required' })
  password!: string;

  @ApiProperty({ example: 'Aibek', description: 'Full name' })
  name!: string;

  @ApiPropertyOptional({ example: '+7 701 234 5678', description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'My Shop', description: 'Business/store name' })
  businessName?: string;
}

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export class LoginDto {
  @ApiProperty({ example: 'merchant@example.com' })
  email!: string;

  @ApiProperty({ example: 'TestPassword123!' })
  password!: string;
}

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;
}

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export class VerifyEmailDto {
  @ApiProperty({ example: 'merchant@example.com' })
  email!: string;

  @ApiProperty({ example: '123456' })
  code!: string;
}

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export class ResendVerificationDto {
  @ApiProperty({ example: 'merchant@example.com' })
  email!: string;
}

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export class ForgotPasswordDto {
  @ApiProperty({ example: 'merchant@example.com' })
  email!: string;
}

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-here' })
  token!: string;

  @ApiProperty({ example: 'NewPassword123!' })
  newPassword!: string;
}
