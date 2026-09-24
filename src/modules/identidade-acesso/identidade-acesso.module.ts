import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/delete-user.use-case.js';
import { FindUserByIdUseCase } from '@/modules/identidade-acesso/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '@/modules/identidade-acesso/application/use-cases/users/list-users.use-case.js';
import { UpdateUserUseCase } from '@/modules/identidade-acesso/application/use-cases/users/update-user.use-case.js';
import { PASSWORD_HASHER } from '@/modules/identidade-acesso/application/contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from '@/modules/identidade-acesso/domain/repositories/user.repository.js';
import { ScryptPasswordHasher } from '@/modules/identidade-acesso/infrastructure/services/password-hasher.service.js';
import { PrismaUserRepository } from '@/modules/identidade-acesso/infrastructure/persistence/prisma/prisma-user.repository.js';
import { UsersController } from '@/modules/identidade-acesso/presentation/controllers/users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
})
export class IdentidadeAcessoModule {}
