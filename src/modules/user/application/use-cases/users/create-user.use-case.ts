import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import type { PasswordHasher } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

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

  /**
   * Um e-mail de usuário excluído não gera um novo registro: o cadastro
   * excluído é reativado com os novos dados, mantendo o id e o histórico.
   */
  async execute(input: CreateUserInput): Promise<User> {
    try {
      const email = input.email.trim().toLowerCase();
      const existing = await this.users.findByEmailIncludingDeleted(email);

      if (existing && !existing.isDeleted) {
        throw new ConflictError(
          `Já existe um usuário cadastrado com o e-mail "${email}".`,
        );
      }

      const data = {
        name: input.name,
        passwordHash: await this.passwordHasher.hash(input.password),
        role: input.role,
        status: input.status,
      };

      if (existing) {
        existing.reregister(data);
        return await this.users.update(existing);
      }

      return await this.users.create(User.create({ ...data, email }));
    } catch (error) {
      this.logger.error(
        `Erro ao cadastrar o usuário: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
