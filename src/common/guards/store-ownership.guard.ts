import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt-auth.guard';

/**
 * Guard that verifies the authenticated user owns the store specified in the URL.
 * Must be placed AFTER JwtAuthGuard (which sets request.user).
 *
 * - Admin roles (super_admin, support) bypass the check.
 * - Merchant: checks store.merchantId === user.merchantId.
 * - Customer: checks that the store exists and is active (customers don't own stores).
 */
@Injectable()
export class StoreOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Get storeId from route params
    const rawStoreId = request.params?.storeId;
    if (!rawStoreId) return true; // No storeId in route, skip check

    const storeId = parseInt(rawStoreId, 10);
    if (isNaN(storeId)) return true;

    // Admin roles bypass ownership check
    if (user.role === 'super_admin' || user.role === 'support' || user.role === 'admin') {
      return true;
    }

    // Look up the store
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true, status: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Merchant must own the store
    if (user.role === 'merchant') {
      if (store.merchantId !== user.merchantId) {
        throw new ForbiddenException('You do not have access to this store');
      }
    }

    // Customer: store must be active (customers access stores, don't own them)
    // We allow customers through as long as the store exists and is active
    if (user.role === 'customer') {
      if (store.status === 'suspended') {
        throw new ForbiddenException('This store is currently unavailable');
      }
      return true;
    }

    return true;
  }
}
