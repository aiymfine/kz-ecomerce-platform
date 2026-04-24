import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import {
  createStoreSchema,
  updateStoreSchema,
} from './dto/store.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@ApiTags('Stores')
@ApiBearerAuth()
@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'List merchant stores' })
  @ApiResponse({ status: 200, description: 'List of stores' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async listStores(@CurrentUser() user: JwtPayload) {
    return this.storesService.listStores(user.merchantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createStoreSchema))
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created' })
  @ApiResponse({ status: 409, description: 'Subdomain already taken' })
  async createStore(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const result = await this.storesService.createStore(
      user.merchantId!,
      body as any,
    );
    if (result && typeof result === 'object' && 'error' in result) {
      const statusMap: Record<string, number> = { CONFLICT: 409 };
      return { statusCode: statusMap[(result as any).error] || 400, ...result };
    }
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store details' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStore(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.storesService.getStore(id, user.merchantId!);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateStoreSchema))
  @ApiOperation({ summary: 'Update store settings' })
  @ApiResponse({ status: 200, description: 'Store updated' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async updateStore(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.storesService.updateStore(id, user.merchantId!, body as any);
  }
}
