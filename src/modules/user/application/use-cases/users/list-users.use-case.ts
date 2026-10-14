import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type {
  UserRepository,
  UserSearchFilters,
} from '@/modules/user/domain/repositories/user.repository.js';
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type Page,
} from '@/shared/domain/pagination.js';
import { logError } from '@/shared/application/log-error.js';

export type ListUsersInput = Partial<UserSearchFilters>;

@Injectable()
export class ListUsersUseCase {
  private readonly logger = new Logger(ListUsersUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: ListUsersInput = {}): Promise<Page<User>> {
    try {
      return await this.users.list({
        ...input,
        page: input.page ?? DEFAULT_PAGE,
        pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
      });
    } catch (error) {
      logError(this.logger, 'Erro ao listar os usuários', error);
      throw error;
    }
  }
}
