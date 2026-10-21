import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
  AuditAction,
  AuditedEntity,
} from '@/modules/audit-log/public/index.js';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly users?: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  /**
   * Encerra apenas a sessão informada (UC-12): o token dela deixa de valer, e
   * as demais sessões do usuário continuam ativas.
   */
  async execute(sessionId: string, userId?: string): Promise<void> {
    try {
      const session = await this.sessions.findById(sessionId);

      if (!session) {
        throw new ResourceNotFoundError('Sessão', sessionId);
      }

      session.end();
      await this.sessions.update(session);

      if (this.auditLogs) {
        const targetUserId = userId ?? session.userId;
        let actorName = 'Usuário';
        if (this.users) {
          const user = await this.users.findById(targetUserId);
          if (user) {
            actorName = user.name;
          }
        }

        await this.auditLogs.record({
          entityType: AuditedEntity.USER,
          entityId: targetUserId,
          actorId: targetUserId,
          actorName,
          action: AuditAction.LOGGED_OUT,
          description: `Usuário "${actorName}" realizou logout do sistema`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Erro ao encerrar a sessão com id ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
