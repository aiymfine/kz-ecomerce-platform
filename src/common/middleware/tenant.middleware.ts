import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (user?.storeId) {
      (req as any).tenant = {
        storeId: user.storeId,
        schemaName: `store_${user.storeId}`,
        merchantId: user.merchantId,
      };
    }
    next();
  }
}
