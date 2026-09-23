import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import { ConflictError } from '#shared/domain/errors/domain.error.js';
import { PASSWORD_HASHER } from '../../contracts/password-hasher.contract.js';
import type { PasswordHasher } from '../../contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);

    if (existing) {
      throw new ConflictError(`Já existe um usuário cadastrado com o e-mail "${email}".`);
    }

    const user = User.create({
      name: input.name,
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: input.role,
      status: input.status,
    });

    return this.users.create(user);
  }
}
