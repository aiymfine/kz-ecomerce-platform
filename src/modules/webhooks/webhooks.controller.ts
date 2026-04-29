import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookEventFilterSchema,
} from './dto/webhook.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('stores/:storeId/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhooks' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async listWebhooks(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.webhooksService.listWebhooks(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createWebhookSchema))
  @ApiOperation({ summary: 'Register a new webhook (returns HMAC secret)' })
  @ApiResponse({ status: 201, description: 'Webhook created with secret' })
  async createWebhook(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: unknown,
  ) {
    return this.webhooksService.createWebhook(storeId, body as any);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateWebhookSchema))
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async updateWebhook(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.webhooksService.updateWebhook(storeId, id, body as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async deleteWebhook(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webhooksService.deleteWebhook(storeId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getWebhook(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webhooksService.getWebhook(storeId, id);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get webhook delivery event log' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'delivering', 'delivered', 'failed', 'dead_letter'] })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Webhook events' })
  async getWebhookEvents(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: Record<string, any>,
  ) {
    const parsed = webhookEventFilterSchema.safeParse(query);
    const params = parsed.success
      ? parsed.data
      : { limit: 20 };
    return this.webhooksService.getWebhookEvents(storeId, id, params);
  }
}
