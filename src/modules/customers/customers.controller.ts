import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { updateCustomerSchema, createAddressSchema, updateAddressSchema } from './dto/customer.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('stores/:storeId/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current customer profile' })
  @ApiResponse({ status: 200, description: 'Customer profile' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getMe(@Param('storeId', ParseIntPipe) storeId: number, @CurrentUser() user: JwtPayload) {
    return this.customersService.getMe(storeId, user.sub);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(updateCustomerSchema))
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateMe(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    return this.customersService.updateMe(storeId, user.sub, body as any);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'List customer addresses' })
  @ApiResponse({ status: 200, description: 'List of addresses' })
  async listAddresses(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.customersService.listAddresses(storeId, user.sub);
  }

  @Post('me/addresses')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createAddressSchema))
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async createAddress(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    return this.customersService.createAddress(storeId, user.sub, body as any);
  }

  @Patch('me/addresses/:id')
  @UsePipes(new ZodValidationPipe(updateAddressSchema))
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.customersService.updateAddress(storeId, user.sub, id, body as any);
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.deleteAddress(storeId, user.sub, id);
  }

  @Patch('me/addresses/:id/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({ status: 200, description: 'Default address updated' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultAddress(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.setDefaultAddress(storeId, user.sub, id);
  }
}
