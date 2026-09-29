import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

/** Adapta o contrato 400 deste recurso sem alterar o filtro compartilhado. */
@Catch(BusinessRuleError, BadRequestException)
export class CargoDocumentValidationFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(
    error: BusinessRuleError | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const response =
      error instanceof BadRequestException
        ? error.getResponse()
        : { message: error.message };
    const message =
      typeof response === 'string'
        ? response
        : (response as { message: string | string[] }).message;
    const translated = Array.isArray(message)
      ? message.map((item) =>
          item.replace(
            /property (.+) should not exist/g,
            'O campo $1 não é permitido.',
          ),
        )
      : message;
    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      {
        statusCode: 400,
        error: 'Requisição inválida',
        message: translated,
      },
      400,
    );
  }
}
