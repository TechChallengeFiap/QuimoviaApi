import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from '@/modules/user/application/use-cases/auth/login.use-case.js';
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
import { JwtAccessTokenService } from '@/modules/user/infrastructure/services/jwt-access-token.service.js';
import { AuthController } from '@/modules/user/presentation/controllers/auth.controller.js';
import { UserModule } from '@/modules/user/user.module.js';

/**
 * Autenticação do contexto Identidade e Acesso: login e o guard global que
 * exige uma sessão ativa em todas as rotas, exceto as marcadas com @Public().
 *
 * Fica separado do UserModule porque o guard vale para a aplicação inteira
 * (APP_GUARD): só o AppModule deve importar este módulo.
 *
 * A configuração (AUTH_CONFIG) é lida das variáveis de ambiente quando o
 * módulo é iniciado; sem um JWT_SECRET válido, a aplicação não sobe.
 */
@Module({
  imports: [UserModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
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
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
