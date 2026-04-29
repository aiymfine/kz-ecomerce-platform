import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  rejectMerchantSchema,
  adminMerchantFilterSchema,
  adminAuditFilterSchema,
} from './dto/admin.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== Merchants ====================

  @Get('merchants')
  @ApiOperation({ summary: 'List all merchants' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
  })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of merchants' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async listMerchants(@Query() query: Record<string, any>) {
    const parsed = adminMerchantFilterSchema.safeParse(query);
    if (!parsed.success) {
      return { statusCode: 400, message: 'Invalid query parameters', details: parsed.error.issues };
    }
    return this.adminService.listMerchants(parsed.data);
  }

  @Get('merchants/:id')
  @ApiOperation({ summary: 'Get merchant details' })
  @ApiResponse({ status: 200, description: 'Merchant details' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getMerchant(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getMerchant(id);
  }

  @Post('merchants/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve merchant and create store' })
  @ApiResponse({ status: 200, description: 'Merchant approved' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async approveMerchant(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.approveMerchant(id);
  }

  @Post('merchants/:id/reject')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(rejectMerchantSchema))
  @ApiOperation({ summary: 'Reject merchant application' })
  @ApiResponse({ status: 200, description: 'Merchant rejected' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async rejectMerchant(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.adminService.rejectMerchant(id, (body as any).reason);
  }

  @Post('merchants/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend merchant' })
  @ApiResponse({ status: 200, description: 'Merchant suspended' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async suspendMerchant(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.suspendMerchant(id);
  }

  @Post('merchants/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate suspended merchant' })
  @ApiResponse({ status: 200, description: 'Merchant activated' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async activateMerchant(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.activateMerchant(id);
  }

  // ==================== Stores ====================

  @Get('stores')
  @ApiOperation({ summary: 'List all stores' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of stores' })
  async listStores(@Query() query: Record<string, any>) {
    const parsed = adminMerchantFilterSchema.safeParse(query);
    const limit = parsed.success ? parsed.data.limit : 20;
    const cursor = parsed.success ? parsed.data.cursor : undefined;
    return this.adminService.listStores({ cursor, limit });
  }

  @Post('stores/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a specific store' })
  @ApiResponse({ status: 200, description: 'Store suspended' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async suspendStore(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.suspendStore(id);
  }

  @Post('stores/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a suspended store' })
  @ApiResponse({ status: 200, description: 'Store activated' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async activateStore(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.activateStore(id);
  }

  // ==================== Analytics ====================

  @Get('analytics')
  @ApiOperation({ summary: 'Platform-wide analytics' })
  @ApiResponse({ status: 200, description: 'Platform analytics' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  // ==================== Audit Log ====================

  @Get('audit-log')
  @ApiOperation({ summary: 'Platform audit log' })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resourceType', required: false, type: String })
  @ApiQuery({ name: 'level', required: false, type: String })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAuditLog(@Query() query: Record<string, any>) {
    const parsed = adminAuditFilterSchema.safeParse(query);
    if (!parsed.success) {
      return { statusCode: 400, message: 'Invalid query parameters' };
    }
    return this.adminService.getAuditLog(parsed.data);
  }
}
