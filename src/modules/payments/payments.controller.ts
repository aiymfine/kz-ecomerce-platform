import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { initiatePaymentSchema, refundSchema } from './dto/payment.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('stores/:storeId/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(initiatePaymentSchema))
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment initiated' })
  async initiatePayment(@Param('storeId', ParseIntPipe) storeId: number, @Body() body: unknown) {
    const dto = body as any;
    return this.paymentsService.initiatePayment(storeId, {
      orderId: dto.order_id,
      provider: dto.provider,
      idempotencyKey: dto.idempotency_key,
    });
  }

  @Post('callback/kaspi')
  @ApiOperation({ summary: 'Kaspi Pay callback endpoint' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async kaspiCallback(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.paymentsService.handleKaspiCallback(storeId, body);
  }

  @Post('callback/halyk')
  @ApiOperation({ summary: 'Halyk Bank callback endpoint' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async halykCallback(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.paymentsService.handleHalykCallback(storeId, body);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refundSchema))
  @ApiOperation({ summary: 'Process refund (full or partial)' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async refund(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = body as any;
    return this.paymentsService.refund(storeId, id, {
      amountTiyin: dto.amount_tiyin,
      reason: dto.reason,
    });
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all payments for an order' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async getPaymentsByOrder(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentsService.getPaymentsByOrder(storeId, orderId);
  }
}
