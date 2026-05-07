import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:register', limit: 5, windowSeconds: 60 })
  @UsePipes(new ZodValidationPipe(registerSchema))
  @ApiOperation({ summary: 'Register a new merchant account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Merchant registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() body: unknown) {
    const result = await this.authService.register(body as any);
    if (result.error) {
      const statusMap: Record<string, number> = {
        CONFLICT: 409,
        WEAK_PASSWORD: 400,
      };
      const statusCode = statusMap[result.error] || 400;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:login', limit: 5, windowSeconds: 60 })
  @UsePipes(new ZodValidationPipe(loginSchema))
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() body: unknown) {
    const result = await this.authService.login(body as any);
    if (result.error) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
      };
      const statusCode = statusMap[result.error] || 400;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  @ApiOperation({ summary: 'Exchange refresh token for new access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refresh(@Body() body: unknown) {
    const result = await this.authService.refreshToken((body as any).refreshToken);
    if (result.error) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
      };
      const statusCode = statusMap[result.error] || 401;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:verify-email', limit: 10, windowSeconds: 60 })
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  @ApiOperation({ summary: 'Verify email with 6-digit code' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyEmail(@Body() body: unknown) {
    const { email, code } = body as { email: string; code: string };
    const result = await this.authService.verifyEmail(email, code);
    if (result.error) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        BAD_REQUEST: 400,
      };
      const statusCode = statusMap[result.error] || 400;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:resend-verification', limit: 3, windowSeconds: 60 })
  @UsePipes(new ZodValidationPipe(resendVerificationSchema))
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(@Body() body: unknown) {
    const { email } = body as { email: string };
    const result = await this.authService.resendVerification(email);
    if (result.error) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        BAD_REQUEST: 400,
      };
      const statusCode = statusMap[result.error] || 400;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:forgot-password', limit: 3, windowSeconds: 60 })
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset link sent' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() body: unknown) {
    const { email } = body as { email: string };
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() body: unknown) {
    const { token, newPassword } = body as { token: string; newPassword: string };
    const result = await this.authService.resetPassword(token, newPassword);
    if (result.error) {
      const statusMap: Record<string, number> = {
        BAD_REQUEST: 400,
        WEAK_PASSWORD: 400,
      };
      const statusCode = statusMap[result.error] || 400;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  @ApiOperation({ summary: 'Admin login (platform admin only)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async adminLogin(@Body() body: unknown) {
    const result = await this.authService.adminLogin(body as any);
    if (result.error) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
      };
      const statusCode = statusMap[result.error] || 400;
      throw new HttpException(
        { statusCode, error: result.error, message: result.message },
        statusCode,
      );
    }
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@CurrentUser() user: JwtPayload) {
    const result = await this.authService.getMe(user.sub);
    if (result.error) {
      return { statusCode: 404, ...result };
    }
    return result;
  }
}
