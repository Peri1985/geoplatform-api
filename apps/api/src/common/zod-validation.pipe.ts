import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

// Validates a body or query against a Zod schema from @repo/shared
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<
  unknown,
  z.infer<T>
> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(z.flattenError(result.error));
    }
    return result.data;
  }
}
