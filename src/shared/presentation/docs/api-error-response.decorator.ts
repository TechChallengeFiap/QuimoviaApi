import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const ERROR_NAMES: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
};

/**
 * Documenta no Swagger uma resposta de erro, com um exemplo no formato que a
 * API devolve: { message, error, statusCode }. É o formato das exceções HTTP
 * do NestJS, inclusive as geradas pelo DomainExceptionFilter.
 */
export function ApiErrorResponse(
  status: HttpStatus,
  description: string,
  message: string | string[],
) {
  return ApiResponse({
    status,
    description,
    schema: {
      example: { message, error: ERROR_NAMES[status], statusCode: status },
    },
  });
}
