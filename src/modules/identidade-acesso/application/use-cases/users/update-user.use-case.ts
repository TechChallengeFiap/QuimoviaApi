import { Inject, Injectable } from '@nestjs/common';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';
import { ConflictError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';
import { PASSWORD_HASHER } from '@/modules/identidade-acesso/application/contracts/password-hasher.contract.ts';
import type { PasswordHasher } from '@/modules/identidade-acesso/application/contracts/password-hasher.contract.ts';
import { USER_REPOSITORY } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';
import type { UserRepository } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new ResourceNotFoundError('Usuário', id);
    }

    if (input.name !== undefined) {
      user.rename(input.name);
    }

    if (input.email !== undefined) {
      await this.changeEmail(user, input.email);
    }

    if (input.password !== undefined) {
      user.changePassword(await this.passwordHasher.hash(input.password));
    }

    if (input.role !== undefined) {
      user.changeRole(input.role);
    }

    if (input.status !== undefined) {
      this.changeStatus(user, input.status);
    }

    return this.users.update(user);
  }

  private async changeEmail(user: User, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === user.email) {
      return;
    }

    const existing = await this.users.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictError(`Já existe um usuário cadastrado com o e-mail "${normalizedEmail}".`);
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
