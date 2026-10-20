import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

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
  ) {}

  async execute(id: string, role: UserRole): Promise<User> {
    try {
      const user = await this.users.findById(id);

      if (!user) {
        throw new ResourceNotFoundError('Usuário', id);
      }

      user.changeRole(role);

      return await this.users.update(user);
    } catch (error) {
      this.logger.error(
        `Erro ao alterar o perfil do usuário com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
