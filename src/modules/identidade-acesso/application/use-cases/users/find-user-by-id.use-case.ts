import { Inject, Injectable } from '@nestjs/common';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { USER_REPOSITORY } from '@/modules/identidade-acesso/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/identidade-acesso/domain/repositories/user.repository.js';

@Injectable()
export class FindUserByIdUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new ResourceNotFoundError('Usuário', id);
    }

    return user;
  }
}
