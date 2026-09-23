import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  ResourceNotFoundError,
} from '../../domain/errors/domain.error.js';

/**
 * Traduz os erros de domínio/aplicação em respostas HTTP apropriadas,
 * mantendo essas camadas livres de qualquer conhecimento do NestJS.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(error: DomainError, host: ArgumentsHost): void {
    const httpException = this.toHttpException(error);
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    httpAdapter.reply(ctx.getResponse(), httpException.getResponse(), httpException.getStatus());
  }

  private toHttpException(error: DomainError) {
    if (error instanceof ResourceNotFoundError) {
      return new NotFoundException(error.message);
    }

    if (error instanceof ConflictError) {
      return new ConflictException(error.message);
    }

    if (error instanceof BusinessRuleError) {
      return new UnprocessableEntityException(error.message);
    }

    return new UnprocessableEntityException(error.message);
  }
}
