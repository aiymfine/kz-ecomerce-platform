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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import {
  inviteStaffSchema,
  updateStaffSchema,
} from './dto/staff.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('stores/:storeId/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'List staff members' })
  @ApiResponse({ status: 200, description: 'List of staff' })
  async listStaff(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.staffService.listStaff(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(inviteStaffSchema))
  @ApiOperation({ summary: 'Invite a staff member' })
  @ApiResponse({ status: 201, description: 'Staff member invited' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async inviteStaff(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() body: unknown,
  ) {
    const result = await this.staffService.inviteStaff(storeId, body as any);
    if (result.error) {
      return { statusCode: 409, ...result };
    }
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member details' })
  @ApiResponse({ status: 200, description: 'Staff member details' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async getStaff(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.staffService.getStaff(storeId, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateStaffSchema))
  @ApiOperation({ summary: 'Update staff role/permissions' })
  @ApiResponse({ status: 200, description: 'Staff member updated' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async updateStaff(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.staffService.updateStaff(storeId, id, body as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove staff member' })
  @ApiResponse({ status: 200, description: 'Staff member removed' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async removeStaff(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.staffService.removeStaff(storeId, id);
  }
}
