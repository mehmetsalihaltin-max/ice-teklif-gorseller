import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Paylaşılan zod şemalarını NestJS doğrulama pipe'ı olarak kullanır.
 * @tignal/shared içindeki şemalar hem API hem web'de tek doğruluk kaynağıdır.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Doğrulama hatası",
        errors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
