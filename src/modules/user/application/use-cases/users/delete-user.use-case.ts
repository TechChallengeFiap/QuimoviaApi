import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import { logError } from '@/shared/application/log-error.js';

@Injectable()
export class DeleteUserUseCase {
  private readonly logger = new Logger(DeleteUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const user = await this.users.findById(id);

      if (!user) {
        throw new ResourceNotFoundError('Usuário', id);
      }

      await this.users.remove(id);
    } catch (error) {
      logError(this.logger, `Erro ao remover o usuário com id ${id}`, error);
      throw error;
    }
  }
}
