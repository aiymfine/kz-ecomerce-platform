import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from './jwt-auth.guard';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('Please verify your email first');
    }

    if (user.emailVerified === false) {
      throw new ForbiddenException('Please verify your email first');
    }

    return true;
  }
}
