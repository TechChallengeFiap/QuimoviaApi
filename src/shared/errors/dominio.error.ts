/**
 * Erros de domínio compartilhados por todos os módulos.
 *
 * A camada de apresentação os traduz em respostas HTTP através do
 * DominioExceptionFilter, de modo que domínio e aplicação permaneçam
 * livres de qualquer dependência do framework.
 */
export abstract class DominioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Uma invariante do domínio foi violada. */
export class RegraDeNegocioError extends DominioError {}

/** O recurso solicitado não existe. */
export class RecursoNaoEncontradoError extends DominioError {
  constructor(recurso: string, identificador: string) {
    super(`${recurso} não encontrado(a) para o identificador "${identificador}".`);
  }
}

/** A operação conflita com um recurso já existente. */
export class ConflitoError extends DominioError {}
