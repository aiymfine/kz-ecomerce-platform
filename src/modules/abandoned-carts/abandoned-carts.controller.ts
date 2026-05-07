import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { AbandonedCartsService } from './abandoned-carts.service';
import { abandonedCartConfigSchema, abandonedCartFilterSchema } from './dto/abandoned-cart.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('abandoned-carts')
export class AbandonedCartsController {
  constructor(private readonly service: AbandonedCartsService) {}

  @Get()
  list(@Query() query: any) {
    const params = abandonedCartFilterSchema.parse(query);
    return this.service.listAbandonedCarts(params);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAbandonedCart(id);
  }

  @Patch('config')
  @UsePipes(new ZodValidationPipe(abandonedCartConfigSchema))
  config(@Body() body: any) {
    // Not persisted - returned as reference for the worker
    return body;
  }

  @Post('scan')
  scan() {
    return this.service.scan();
  }
}
