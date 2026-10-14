import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  AccessDeniedError,
  AuthenticationError,
  BusinessRuleError,
  ConflictError,
  DomainError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

/**
 * Traduz os erros de domínio/aplicação em respostas HTTP apropriadas,
 * mantendo essas camadas livres de qualquer conhecimento do NestJS.
 */
@Catch(DomainError)
@Injectable()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(@Optional() private readonly httpAdapterHost?: HttpAdapterHost) {}

  catch(error: DomainError, host: ArgumentsHost): void {
    const httpException = this.toHttpException(error);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (this.httpAdapterHost?.httpAdapter) {
      this.httpAdapterHost.httpAdapter.reply(
        response,
        httpException.getResponse(),
        httpException.getStatus(),
      );
      return;
    }

    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }

  private toHttpException(error: DomainError) {
    if (error instanceof ResourceNotFoundError) {
      return new NotFoundException(error.message);
    }

    if (error instanceof ConflictError) {
      return new ConflictException(error.message);
    }

    if (error instanceof AuthenticationError) {
      return new UnauthorizedException(error.message);
    }

    if (error instanceof AccessDeniedError) {
      return new ForbiddenException(error.message);
    }

    if (error instanceof BusinessRuleError) {
      return new UnprocessableEntityException(error.message);
    }

    return new UnprocessableEntityException(error.message);
  }
}
