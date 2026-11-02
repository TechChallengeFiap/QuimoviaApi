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
import type { UserActionActor } from './create-user.use-case.js';

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
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, actor?: UserActionActor | null): Promise<void> {
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

      if (this.auditLogs) {
        let actorName = actor?.name;
        if (!actorName && actor?.id) {
          const actorUser = await this.users.findById(actor.id);
          actorName = actorUser?.name;
        }
        const resolvedActorName = actorName ?? 'Administrador do Sistema';
        const actorId = actor?.id ?? 'sistema';

        await this.auditLogs.record({
          entityType: AuditedEntity.USER,
          entityId: user.id,
          actorId,
          actorName: resolvedActorName,
          action: AuditAction.DELETED,
          description: `Usuário "${resolvedActorName}" excluiu o usuário "${user.name}" (${user.email})`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Erro ao remover o usuário com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
