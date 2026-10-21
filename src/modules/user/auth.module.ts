import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from '@/modules/user/application/use-cases/auth/login.use-case.js';
import { LogoutUseCase } from '@/modules/user/application/use-cases/auth/logout.use-case.js';
import { ValidateSessionUseCase } from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { ACCESS_TOKEN_SERVICE } from '@/modules/user/application/contracts/access-token.contract.js';
import { SESSION_SETTINGS } from '@/modules/user/application/contracts/session-settings.contract.js';
import type { SessionSettings } from '@/modules/user/application/contracts/session-settings.contract.js';
import {
  AUTH_CONFIG,
  loadAuthConfig,
} from '@/modules/user/infrastructure/auth/auth.config.js';
import type { AuthConfig } from '@/modules/user/infrastructure/auth/auth.config.js';
import { AuthGuard } from '@/modules/user/infrastructure/auth/auth.guard.js';
import { RolesGuard } from '@/modules/user/infrastructure/auth/roles.guard.js';
import { JwtAccessTokenService } from '@/modules/user/infrastructure/services/jwt-access-token.service.js';
import { AuthController } from '@/modules/user/presentation/controllers/auth.controller.js';
import { UserModule } from '@/modules/user/user.module.js';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module.js';

/**
 * Autenticação do contexto Identidade e Acesso: login, logout, o AuthGuard,
 * que exige uma sessão ativa nas rotas em que é aplicado, e o RolesGuard,
 * que restringe a rota aos perfis informados em @Roles().
 *
 * Para proteger as rotas de outro módulo, importe este módulo nele e use
 * @UseGuards(AuthGuard) ou @UseGuards(AuthGuard, RolesGuard) no controller ou
 * no endpoint.
 *
 * A configuração (AUTH_CONFIG) é lida das variáveis de ambiente quando o
 * módulo é iniciado; sem um JWT_SECRET válido, a aplicação não sobe.
 */
@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => AuditLogModule),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    LogoutUseCase,
    ValidateSessionUseCase,
    { provide: AUTH_CONFIG, useFactory: () => loadAuthConfig() },
    {
      provide: SESSION_SETTINGS,
      inject: [AUTH_CONFIG],
      useFactory: (config: AuthConfig): SessionSettings => ({
        durationInSeconds: config.sessionDurationInSeconds,
      }),
    },
    { provide: ACCESS_TOKEN_SERVICE, useClass: JwtAccessTokenService },
    AuthGuard,
    RolesGuard,
  ],
  exports: [AuthGuard, RolesGuard, ValidateSessionUseCase],
})
export class AuthModule {}
