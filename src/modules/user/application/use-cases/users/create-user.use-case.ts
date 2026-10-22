import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import type { PasswordHasher } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
  AuditAction,
  AuditedEntity,
} from '@/modules/audit-log/public/index.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UserActionActor {
  id: string;
  name?: string;
}

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  /**
   * Um e-mail de usuário excluído não gera um novo registro: o cadastro
   * excluído é reativado com os novos dados, mantendo o id e o histórico.
   */
  async execute(
    input: CreateUserInput,
    actor?: UserActionActor | null,
  ): Promise<User> {
    try {
      const email = input.email.trim().toLowerCase();
      const existing = await this.users.findByEmailIncludingDeleted(email);

      if (existing && !existing.isDeleted) {
        throw new ConflictError(
          `Já existe um usuário cadastrado com o e-mail "${email}".`,
        );
      }

      const data = {
        name: input.name,
        passwordHash: await this.passwordHasher.hash(input.password),
        role: input.role,
        status: input.status,
      };

      if (existing) {
        existing.reregister(data);
      }

      const createdUser = existing
        ? await this.users.update(existing)
        : await this.users.create(User.create({ ...data, email }));

      if (this.auditLogs) {
        let actorName = actor?.name;
        if (!actorName && actor?.id) {
          const actorUser = await this.users.findById(actor.id);
          actorName = actorUser?.name;
        }
        const resolvedActorName = actorName ?? 'Administrador do Sistema';
        const actorId = actor?.id ?? createdUser.id;

        await this.auditLogs.record({
          entityType: AuditedEntity.USER,
          entityId: createdUser.id,
          actorId,
          actorName: resolvedActorName,
          action: AuditAction.CREATED,
          description: `Usuário "${resolvedActorName}" cadastrou o usuário "${createdUser.name}" (${createdUser.email})`,
          details: { role: createdUser.role, status: createdUser.status },
        });
      }

      return createdUser;
    } catch (error) {
      this.logger.error(
        `Erro ao cadastrar o usuário: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
