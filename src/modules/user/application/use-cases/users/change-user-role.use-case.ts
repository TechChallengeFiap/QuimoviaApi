import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
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
 * Troca o perfil de acesso de um usuário. A rota é exclusiva do Administrador
 * do Sistema, e a troca vale já na próxima requisição do usuário, porque o
 * AuthGuard lê o perfil atual a cada chamada.
 */
@Injectable()
export class ChangeUserRoleUseCase {
  private readonly logger = new Logger(ChangeUserRoleUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, role: UserRole, actor?: UserActionActor | null): Promise<User> {
    try {
      const user = await this.users.findById(id);

      if (!user) {
        throw new ResourceNotFoundError('Usuário', id);
      }

      const previousRole = user.role;
      user.changeRole(role);

      const updatedUser = await this.users.update(user);

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
          entityId: updatedUser.id,
          actorId,
          actorName: resolvedActorName,
          action: AuditAction.ROLE_CHANGED,
          description: `Usuário "${resolvedActorName}" alterou o perfil do usuário "${updatedUser.name}" de ${previousRole} para ${role}`,
          details: { previousRole, newRole: role },
        });
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao alterar o perfil do usuário com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
