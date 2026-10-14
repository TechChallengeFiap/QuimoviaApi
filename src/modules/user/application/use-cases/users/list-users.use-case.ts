import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type Page,
} from '@/shared/domain/pagination.js';

export interface ListUsersInput {
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListUsersUseCase {
  private readonly logger = new Logger(ListUsersUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: ListUsersInput = {}): Promise<Page<User>> {
    try {
      return await this.users.list({
        role: input.role,
        status: input.status,
        page: input.page ?? DEFAULT_PAGE,
        pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar os usuários: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
