import { forwardRef, Module } from '@nestjs/common';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { FindUserByIdUseCase } from '@/modules/user/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '@/modules/user/application/use-cases/users/list-users.use-case.js';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { ChangeUserRoleUseCase } from '@/modules/user/application/use-cases/users/change-user-role.use-case.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import { ScryptPasswordHasher } from '@/modules/user/infrastructure/services/password-hasher.service.js';
import { PrismaSessionRepository } from '@/modules/user/infrastructure/persistence/prisma/prisma-session.repository.js';
import { PrismaUserRepository } from '@/modules/user/infrastructure/persistence/prisma/prisma-user.repository.js';
import { AuthModule } from '@/modules/user/auth.module.js';
import { UsersController } from '@/modules/user/presentation/controllers/users.controller.js';

/**
 * Cadastro de usuários. Importa o AuthModule para proteger as rotas de
 * gestão com o AuthGuard e o RolesGuard; como o AuthModule também depende
 * deste módulo (repositórios e hash de senha), os dois se importam com
 * forwardRef.
 */
@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    ChangeUserRoleUseCase,
    DeleteUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY, PASSWORD_HASHER],
})
export class UserModule {}
