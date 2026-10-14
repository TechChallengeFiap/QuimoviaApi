import type {
  UserRepository,
  UserSearchFilters,
} from '@/modules/user/domain/repositories/user.repository.js';
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import type { Page } from '@/shared/domain/pagination.js';

/** Implementação em memória de UserRepository, para uso nos testes. */
export class UserRepositoryMock implements UserRepository {
  private readonly users = new Map<string, User>();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async remove(id: string): Promise<void> {
    this.users.delete(id);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findManyByIds(ids: readonly string[]): Promise<User[]> {
    return ids.flatMap((id) => this.users.get(id) ?? []);
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      [...this.users.values()].find((user) => user.email === email) ?? null
    );
  }

  async registerLogin(user: User): Promise<boolean> {
    return this.users.get(user.id)?.status === UserStatus.ACTIVE;
  }

  async list(filters: UserSearchFilters): Promise<Page<User>> {
    let items = [...this.users.values()];

    if (filters.role) {
      items = items.filter((user) => user.role === filters.role);
    }

    if (filters.status) {
      items = items.filter((user) => user.status === filters.status);
    }

    const total = items.length;
    const start = (filters.page - 1) * filters.pageSize;

    return {
      items: items.slice(start, start + filters.pageSize),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }
}
