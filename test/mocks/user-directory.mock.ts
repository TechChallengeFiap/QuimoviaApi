import type {
  UserDirectory,
  UserSummary,
} from '@/modules/user/public/index.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

export class UserDirectoryMock implements UserDirectory {
  constructor(private readonly users: UserRepository) {}

  async findById(id: string): Promise<UserSummary | null> {
    const user = await this.users.findById(id.toLowerCase());
    return user ? { id: user.id, name: user.name } : null;
  }

  async findByIds(ids: readonly string[]): Promise<UserSummary[]> {
    const users = await Promise.all(
      [...new Set(ids)].map((id) => this.findById(id)),
    );
    return users.filter((user): user is UserSummary => user !== null);
  }
}
