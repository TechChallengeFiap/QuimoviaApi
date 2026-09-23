import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.js';
import type { UserPage, UserRepository } from '../../../domain/repositories/user.repository.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListUsersInput {
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(input: ListUsersInput = {}): Promise<UserPage> {
    return this.users.list({
      role: input.role,
      status: input.status,
      page: input.page ?? DEFAULT_PAGE,
      pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
    });
  }
}
