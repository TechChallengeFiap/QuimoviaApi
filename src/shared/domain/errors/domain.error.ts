/**
 * Erros de domínio compartilhados por todos os módulos.
 *
 * A camada de apresentação os traduz em respostas HTTP através do
 * DomainExceptionFilter, de modo que domínio e aplicação permaneçam
 * livres de qualquer dependência do framework.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Uma invariante do domínio foi violada. */
export class BusinessRuleError extends DomainError {}

/** O recurso solicitado não existe. */
export class ResourceNotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} não encontrado(a) para o identificador "${id}".`);
  }
}

/** A operação conflita com um recurso já existente. */
export class ConflictError extends DomainError {}
