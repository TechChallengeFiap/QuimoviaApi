import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  AccessDeniedError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import type { AuthenticatedSession } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import type { PasswordHasher } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  status?: UserStatus;
}

/** Quem pede a alteração: o próprio usuário ou o Administrador do Sistema. */
export type UpdateUserRequester = Pick<AuthenticatedSession, 'userId' | 'role'>;

export const UPDATE_OTHER_USER_DENIED_MESSAGE =
  'Apenas o Administrador do Sistema pode alterar os dados de outro usuário.';

export const BLOCK_USER_DENIED_MESSAGE =
  'Apenas o Administrador do Sistema pode bloquear um usuário.';

@Injectable()
export class UpdateUserUseCase {
  private readonly logger = new Logger(UpdateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}

  /**
   * O perfil não é alterado aqui: a troca de perfil é exclusiva do
   * administrador e tem caso de uso próprio (ChangeUserRoleUseCase).
   */
  async execute(
    id: string,
    input: UpdateUserInput,
    requester: UpdateUserRequester,
  ): Promise<User> {
    try {
      this.ensureCanUpdate(id, input, requester);

      const user = await this.users.findById(id);

      if (!user) {
        throw new ResourceNotFoundError('Usuário', id);
      }

      const previousStatus = user.status;

      if (input.name !== undefined) {
        user.rename(input.name);
      }

      if (input.email !== undefined) {
        await this.changeEmail(user, input.email);
      }

      if (input.password !== undefined) {
        user.changePassword(await this.passwordHasher.hash(input.password));
      }

      if (input.status !== undefined) {
        this.changeStatus(user, input.status);
      }

      // A inativação ou o bloqueio invalida as sessões vigentes do usuário
      // (RN-ACE-03); reativar a conta não as reativa. As sessões são
      // encerradas antes de gravar o novo status: se o encerramento falhar, o
      // status não muda e nenhuma sessão fica aberta para voltar a valer numa
      // reativação.
      if (user.status !== previousStatus && !user.canAuthenticate()) {
        await this.sessions.endAllByUserId(user.id, new Date());
      }

      return await this.users.update(user);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar o usuário com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Quem não é administrador só altera os próprios dados e não pode se
   * bloquear: o bloqueio, assim como o desbloqueio, é decisão do
   * Administrador do Sistema.
   */
  private ensureCanUpdate(
    id: string,
    input: UpdateUserInput,
    requester: UpdateUserRequester,
  ): void {
    if (requester.role === UserRole.SYSTEM_ADMIN) {
      return;
    }

    if (requester.userId !== id) {
      throw new AccessDeniedError(UPDATE_OTHER_USER_DENIED_MESSAGE);
    }

    if (input.status === UserStatus.BLOCKED) {
      throw new AccessDeniedError(BLOCK_USER_DENIED_MESSAGE);
    }
  }

  private async changeEmail(user: User, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === user.email) {
      return;
    }

    // Inclui os excluídos: o e-mail deles continua reservado.
    const existing =
      await this.users.findByEmailIncludingDeleted(normalizedEmail);

    if (existing) {
      throw new ConflictError(
        `Já existe um usuário cadastrado com o e-mail "${normalizedEmail}".`,
      );
    }

    user.changeEmail(normalizedEmail);
  }

  /**
   * As transições passam pelos métodos da entidade para que as regras de
   * bloqueio e desbloqueio sejam respeitadas.
   */
  private changeStatus(user: User, status: UserStatus): void {
    if (user.status === status) {
      return;
    }

    switch (status) {
      case UserStatus.ACTIVE:
        if (user.status === UserStatus.BLOCKED) {
          user.unblock();
        } else {
          user.activate();
        }
        break;
      case UserStatus.INACTIVE:
        user.deactivate();
        break;
      case UserStatus.BLOCKED:
        user.block();
        break;
    }
  }
}
