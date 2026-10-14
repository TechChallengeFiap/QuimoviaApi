import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import type {
  UserDirectory,
  UserSummary,
} from '@/modules/user/public/user-directory.contract.js';

/** Implementação do contrato público UserDirectory, a partir do repositório. */
@Injectable()
export class UserDirectoryService implements UserDirectory {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async findById(id: string): Promise<UserSummary | null> {
    const user = await this.users.findById(id);

    return user ? UserDirectoryService.toSummary(user) : null;
  }

  async findByIds(ids: readonly string[]): Promise<UserSummary[]> {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return [];
    }

    const users = await this.users.findManyByIds(uniqueIds);

    return users.map((user) => UserDirectoryService.toSummary(user));
  }

  private static toSummary(user: User): UserSummary {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
