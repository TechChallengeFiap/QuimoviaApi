import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';
import { USER_REPOSITORY } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';
import type { UserRepository } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new ResourceNotFoundError('Usuário', id);
    }

    await this.users.remove(id);
  }
}
