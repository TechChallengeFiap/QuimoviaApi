import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

@Injectable()
export class FindUserByIdUseCase {
  private readonly logger = new Logger(FindUserByIdUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    try {
      const user = await this.users.findById(id);

      if (!user) {
        throw new ResourceNotFoundError('Usuário', id);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar o usuário com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
