import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { renderTemplate } from './sandbox';
import { sanitizeHtml } from './sanitizer';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async listTemplates() {
    return this.prisma.themeTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: number) {
    const template = await this.prisma.themeTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async createTemplate(data: { name: string; templateContent: string }) {
    return this.prisma.themeTemplate.create({
      data: {
        name: data.name,
        templateContent: data.templateContent,
      },
    });
  }

  async updateTemplate(id: number, data: { name?: string; templateContent?: string }) {
    const existing = await this.prisma.themeTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.templateContent !== undefined) updateData.templateContent = data.templateContent;

    return this.prisma.themeTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTemplate(id: number) {
    const existing = await this.prisma.themeTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.themeTemplate.delete({
      where: { id },
    });

    return { message: 'Template deleted' };
  }

  async renderTemplate(id: number, data: Record<string, any>) {
    const template = await this.prisma.themeTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const rendered = renderTemplate(template.templateContent, data);
    const sanitized = sanitizeHtml(rendered);

    return { rendered: sanitized };
  }
}
