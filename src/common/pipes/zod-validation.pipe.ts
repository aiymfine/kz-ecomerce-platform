import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return value;
    }

    // When used at method level, NestJS runs the pipe on ALL params
    // (@Param, @Body, @CurrentUser, etc). Only validate if the value
    // has at least one key matching the schema's shape — this lets
    // unrelated objects (like JWT payloads) pass through untouched.
    const keys = Object.keys(value);
    const schemaShape = (this.schema as any)._def?.shape;
    if (schemaShape) {
      const schemaKeys = Object.keys(schemaShape);
      if (!keys.some((k) => schemaKeys.includes(k))) {
        return value;
      }
    }

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
