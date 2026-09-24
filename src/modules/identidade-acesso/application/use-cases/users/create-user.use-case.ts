import { Inject, Injectable } from '@nestjs/common';
import { User } from '@/modules/identidade-acesso/domain/entities/user.entity.ts';
import { UserRole } from '@/modules/identidade-acesso/domain/enums/user-role.enum.ts';
import { UserStatus } from '@/modules/identidade-acesso/domain/enums/user-status.enum.ts';
import { ConflictError } from '@/shared/domain/errors/domain.error.ts';
import { PASSWORD_HASHER } from '@/modules/identidade-acesso/application/contracts/password-hasher.contract.ts';
import type { PasswordHasher } from '@/modules/identidade-acesso/application/contracts/password-hasher.contract.ts';
import { USER_REPOSITORY } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';
import type { UserRepository } from '@/modules/identidade-acesso/domain/repositories/user.repository.ts';

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
