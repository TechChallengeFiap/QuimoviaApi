import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import type {
  UserDirectory,
  UserSummary,
} from '@/modules/user/public/user-directory.contract.js';

@Injectable()
export class UserDirectoryService implements UserDirectory {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async findById(id: string): Promise<UserSummary | null> {
    const user = await this.users.findById(id.toLowerCase());
    return user ? { id: user.id, name: user.name } : null;
  }

  async findByIds(ids: readonly string[]): Promise<UserSummary[]> {
    const identifiers = [...new Set(ids.map((id) => id.toLowerCase()))];
    if (identifiers.length === 0) return [];
    const users = await this.users.findByIds(identifiers);
    return users.map((user) => ({ id: user.id, name: user.name }));
  }
}
