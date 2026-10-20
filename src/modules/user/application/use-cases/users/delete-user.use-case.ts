import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

/**
 * Exclui o usuário logicamente: o registro continua no banco, mas some das
 * buscas e da listagem e perde o acesso ao sistema.
 */
@Injectable()
export class DeleteUserUseCase {
  private readonly logger = new Logger(DeleteUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const user = await this.users.findById(id);

      if (!user) {
        throw new ResourceNotFoundError('Usuário', id);
      }

      const now = new Date();
      user.delete(now);

      // Como no bloqueio, as sessões são encerradas antes de gravar a
      // exclusão: se o encerramento falhar, nada muda.
      await this.sessions.endAllByUserId(user.id, now);
      await this.users.update(user);
    } catch (error) {
      this.logger.error(
        `Erro ao remover o usuário com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
