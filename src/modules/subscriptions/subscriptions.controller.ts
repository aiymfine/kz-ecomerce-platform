import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  createSubscriptionBoxSchema,
  updateSubscriptionBoxSchema,
  addBoxItemSchema,
  subscribeSchema,
  pauseSchema,
} from './dto/subscription.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('subscription-boxes')
export class SubscriptionBoxesController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createSubscriptionBoxSchema))
  create(@Body() body: any) {
    return this.service.createBox(body);
  }

  @Get()
  list() {
    return this.service.listBoxes();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.getBox(id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateSubscriptionBoxSchema))
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateBox(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteBox(id);
  }

  @Post(':id/items')
  @UsePipes(new ZodValidationPipe(addBoxItemSchema))
  addItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.addBoxItem(id, body);
  }

  @Delete(':id/items/:variantId')
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.service.removeBoxItem(id, variantId);
  }
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post('subscribe')
  @UsePipes(new ZodValidationPipe(subscribeSchema))
  subscribe(@Body() body: any) {
    return this.service.subscribe(body);
  }

  @Get('my')
  mySubscriptions(@Query('customer_id', ParseIntPipe) customerId: number) {
    return this.service.mySubscriptions(customerId);
  }

  @Patch(':id/pause')
  @UsePipes(new ZodValidationPipe(pauseSchema))
  pause(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.pauseSubscription(id, body?.reason);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancelSubscription(id);
  }

  @Patch(':id/resume')
  resume(@Param('id', ParseIntPipe) id: number) {
    return this.service.resumeSubscription(id);
  }
}
