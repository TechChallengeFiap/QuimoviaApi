import { Type, ValidationPipe } from '@nestjs/common';
import type { ValidationPipeOptions } from '@nestjs/common';

/**
 * Informa ao ValidationPipe o DTO esperado. Sem a metadata `design:paramtypes`
 * (não emitida pelo tsx), o pipe global não sabe o tipo do parâmetro e deixa
 * de validar e de converter os dados.
 */
export function validationPipeFor(
  expectedType: Type<unknown>,
  options: Pick<ValidationPipeOptions, 'exceptionFactory'> = {},
): ValidationPipe {
  return new ValidationPipe({
    ...options,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    expectedType,
  });
}
