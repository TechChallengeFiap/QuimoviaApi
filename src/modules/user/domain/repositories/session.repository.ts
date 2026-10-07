import { Session } from '@/modules/user/domain/entities/session.entity.js';

/**
 * Porta de persistência das sessões de acesso.
 *
 * A camada de aplicação depende apenas desta interface; a implementação
 * concreta (Prisma) vive na camada de infraestrutura.
 */
export interface SessionRepository {
  create(session: Session): Promise<Session>;
  update(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  /**
   * Encerra as sessões do usuário que ainda não foram encerradas e retorna
   * quantas foram afetadas.
   */
  endAllByUserId(userId: string, endedAt: Date): Promise<number>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const SESSION_REPOSITORY = Symbol('SessionRepository');
