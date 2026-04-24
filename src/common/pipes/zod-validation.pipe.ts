import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        error: 'Bad Request',
        details: errors,
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError): string[] {
    return error.errors.map((e) => {
      const path = e.path.join('.');
      return `${path}: ${e.message}`;
    });
  }
}
