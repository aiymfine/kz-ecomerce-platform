import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantContext = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = (request as any).tenant as Record<string, unknown> | undefined;
    return data ? tenant?.[data] : tenant;
  },
);
