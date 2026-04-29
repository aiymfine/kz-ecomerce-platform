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
import { TemplatesService } from './templates.service';
import {
  createTemplateSchema,
  updateTemplateSchema,
  renderTemplateSchema,
} from './dto/template.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async listTemplates() {
    return this.templatesService.listTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by id' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.getTemplate(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createTemplateSchema))
  @ApiOperation({ summary: 'Create template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Body() body: unknown) {
    return this.templatesService.createTemplate(body as any);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateTemplateSchema))
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.templatesService.updateTemplate(id, body as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.deleteTemplate(id);
  }

  @Post(':id/render')
  @UsePipes(new ZodValidationPipe(renderTemplateSchema))
  @ApiOperation({ summary: 'Render template with data (preview)' })
  @ApiResponse({ status: 200, description: 'Rendered template output' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async renderTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const { data } = body as { data: Record<string, any> };
    return this.templatesService.renderTemplate(id, data);
  }
}
