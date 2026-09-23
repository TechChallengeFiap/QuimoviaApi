import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/use-cases/users/create-user.use-case.js';
import { PASSWORD_HASHER } from './application/contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from './domain/repositories/user.repository.js';
import { ScryptPasswordHasher } from './infrastructure/services/password-hasher.service.js';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user.repository.js';
import { UsersController } from './presentation/controllers/users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
})
export class IdentidadeAcessoModule {}
