import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

export interface SessionProperties {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
}

export interface StartSessionData {
  userId: string;
  durationInSeconds: number;
  startedAt?: Date;
}

/**
 * Sessão de acesso de um usuário (RN-ACE-02 e RN-ACE-03).
 *
 * Fica vinculada ao usuário e tem prazo de expiração, mas pode ser encerrada
 * antes dele: no logout ou quando o usuário é bloqueado ou inativado. Uma
 * sessão expirada ou encerrada não volta a valer; o usuário precisa
 * autenticar-se novamente.
 */
export class Session {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;

  #endedAt: Date | null;

  private constructor(properties: SessionProperties) {
    this.id = properties.id;
    this.userId = properties.userId;
    this.createdAt = properties.createdAt;
    this.expiresAt = properties.expiresAt;
    this.#endedAt = properties.endedAt;
  }

  /** Inicia uma sessão que vale pela duração informada. */
  static start(data: StartSessionData): Session {
    if (data.userId.trim().length === 0) {
      throw new BusinessRuleError(
        'A sessão deve estar vinculada a um usuário.',
      );
    }

    if (
      !Number.isInteger(data.durationInSeconds) ||
      data.durationInSeconds < 1
    ) {
      throw new BusinessRuleError(
        'A duração da sessão deve ser um número inteiro de segundos maior que zero.',
      );
    }

    const startedAt = data.startedAt ?? new Date();

    return new Session({
      id: randomUUID(),
      userId: data.userId,
      createdAt: startedAt,
      expiresAt: new Date(startedAt.getTime() + data.durationInSeconds * 1000),
      endedAt: null,
    });
  }

  /** Reconstrói uma sessão já persistida, sem revalidar os dados. */
  static restore(properties: SessionProperties): Session {
    return new Session(properties);
  }

  get endedAt(): Date | null {
    return this.#endedAt;
  }

  /** A sessão só autoriza acesso enquanto não expirou nem foi encerrada. */
  isActive(at: Date = new Date()): boolean {
    return this.#endedAt === null && at.getTime() < this.expiresAt.getTime();
  }

  /**
   * Encerra a sessão. Encerrar uma sessão já encerrada mantém a data do
   * primeiro encerramento.
   */
  end(at: Date = new Date()): void {
    if (this.#endedAt === null) {
      this.#endedAt = at;
    }
  }

  toObject(): SessionProperties {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      endedAt: this.#endedAt,
    };
  }
}
