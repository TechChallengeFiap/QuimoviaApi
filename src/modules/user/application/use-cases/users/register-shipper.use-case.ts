import { Inject, Injectable } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  CreateUserUseCase,
  SELF_REGISTRATION,
} from '@/modules/user/application/use-cases/users/create-user.use-case.js';

export interface RegisterShipperInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Cadastro público do embarcador, feito por ele mesmo. O perfil é sempre
 * SHIPPER_DRIVER e a conta já nasce ativa; as demais regras (e-mail único,
 * hash da senha e auditoria) são as do cadastro interno.
 */
@Injectable()
export class RegisterShipperUseCase {
  constructor(
    @Inject(CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  async execute(input: RegisterShipperInput): Promise<User> {
    return this.createUserUseCase.execute(
      {
        name: input.name,
        email: input.email,
        password: input.password,
        role: UserRole.SHIPPER_DRIVER,
        status: UserStatus.ACTIVE,
      },
      SELF_REGISTRATION,
    );
  }
}
