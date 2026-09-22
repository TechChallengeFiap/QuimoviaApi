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
  ConflitoError,
  DominioError,
  RecursoNaoEncontradoError,
  RegraDeNegocioError,
} from '../../domain/errors/dominio.error.js';

/**
 * Traduz os erros de domínio/aplicação em respostas HTTP apropriadas,
 * mantendo essas camadas livres de qualquer conhecimento do NestJS.
 */
@Catch(DominioError)
export class DominioExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(erro: DominioError, host: ArgumentsHost): void {
    const excecaoHttp = this.paraExcecaoHttp(erro);
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    httpAdapter.reply(ctx.getResponse(), excecaoHttp.getResponse(), excecaoHttp.getStatus());
  }

  private paraExcecaoHttp(erro: DominioError) {
    if (erro instanceof RecursoNaoEncontradoError) {
      return new NotFoundException(erro.message);
    }

    if (erro instanceof ConflitoError) {
      return new ConflictException(erro.message);
    }

    if (erro instanceof RegraDeNegocioError) {
      return new UnprocessableEntityException(erro.message);
    }

    return new UnprocessableEntityException(erro.message);
  }
}
