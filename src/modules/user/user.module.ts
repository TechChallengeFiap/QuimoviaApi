import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ACCESS_TOKEN_SERVICE } from '@/modules/user/application/contracts/access-token.contract.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { SESSION_SETTINGS } from '@/modules/user/application/contracts/session-settings.contract.js';
import type { SessionSettings } from '@/modules/user/application/contracts/session-settings.contract.js';
import { UserDirectoryService } from '@/modules/user/application/services/user-directory.service.js';
import { LoginUseCase } from '@/modules/user/application/use-cases/auth/login.use-case.js';
import { LogoutUseCase } from '@/modules/user/application/use-cases/auth/logout.use-case.js';
import { ValidateSessionUseCase } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { FindUserByIdUseCase } from '@/modules/user/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '@/modules/user/application/use-cases/users/list-users.use-case.js';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUTH_CONFIG,
  loadAuthConfig,
} from '@/modules/user/infrastructure/config/auth.config.js';
import type { AuthConfig } from '@/modules/user/infrastructure/config/auth.config.js';
import { PrismaSessionRepository } from '@/modules/user/infrastructure/persistence/prisma/prisma-session.repository.js';
import { PrismaUserRepository } from '@/modules/user/infrastructure/persistence/prisma/prisma-user.repository.js';
import { JwtAccessTokenService } from '@/modules/user/infrastructure/services/jwt-access-token.service.js';
import { ScryptPasswordHasher } from '@/modules/user/infrastructure/services/password-hasher.service.js';
import { AuthController } from '@/modules/user/presentation/controllers/auth.controller.js';
import { UsersController } from '@/modules/user/presentation/controllers/users.controller.js';
import { AuthGuard } from '@/modules/user/presentation/guards/auth.guard.js';
import { USER_DIRECTORY } from '@/modules/user/public/user-directory.contract.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';

/**
 * Módulo do contexto Identidade e Acesso: cadastro de usuários, sessões,
 * login, logout e o AuthGuard.
 *
 * Exporta apenas o que a API pública do contexto (src/modules/user/public/)
 * oferece a outros contextos:
 *
 * - USER_DIRECTORY, para consultar usuários;
 * - AuthGuard, para exigir uma sessão ativa com @UseGuards(AuthGuard). O guard
 *   é instanciado no módulo do controller que o usa, por isso a dependência
 *   dele (ValidateSessionUseCase) também é exportada.
 *
 * Repositórios, hash de senha e tokens de acesso continuam privados.
 *
 * A configuração (AUTH_CONFIG) é lida das variáveis de ambiente quando o
 * módulo é iniciado; sem um JWT_SECRET válido, a aplicação não sobe.
 */
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [UsersController, AuthController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    LoginUseCase,
    LogoutUseCase,
    ValidateSessionUseCase,
    AuthGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: ACCESS_TOKEN_SERVICE, useClass: JwtAccessTokenService },
    { provide: AUTH_CONFIG, useFactory: () => loadAuthConfig() },
    {
      provide: SESSION_SETTINGS,
      inject: [AUTH_CONFIG],
      useFactory: (config: AuthConfig): SessionSettings => ({
        durationInSeconds: config.sessionDurationInSeconds,
      }),
    },
    { provide: USER_DIRECTORY, useClass: UserDirectoryService },
  ],
  exports: [USER_DIRECTORY, AuthGuard, ValidateSessionUseCase],
})
export class UserModule {}
