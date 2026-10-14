import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import { logError } from '@/shared/application/log-error.js';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}

  /**
   * Encerra apenas a sessão informada (UC-12): o token dela deixa de valer, e
   * as demais sessões do usuário continuam ativas.
   */
  async execute(sessionId: string): Promise<void> {
    try {
      const session = await this.sessions.findById(sessionId);

      if (!session) {
        throw new ResourceNotFoundError('Sessão', sessionId);
      }

      session.end();
      await this.sessions.update(session);
    } catch (error) {
      logError(
        this.logger,
        `Erro ao encerrar a sessão com id ${sessionId}`,
        error,
      );
      throw error;
    }
  }
}
