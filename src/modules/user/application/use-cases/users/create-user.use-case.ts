import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import type { PasswordHasher } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import { logError } from '@/shared/application/log-error.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    try {
      const email = input.email.trim().toLowerCase();
      const existing = await this.users.findByEmail(email);

      if (existing) {
        throw new ConflictError(
          `Já existe um usuário cadastrado com o e-mail "${email}".`,
        );
      }

      const user = User.create({
        name: input.name,
        email,
        passwordHash: await this.passwordHasher.hash(input.password),
        role: input.role,
        status: input.status,
      });

      return await this.users.create(user);
    } catch (error) {
      logError(this.logger, 'Erro ao cadastrar o usuário', error);
      throw error;
    }
  }
}
