import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import {
  AccessDeniedError,
  AuthenticationError,
} from '@/shared/domain/errors/domain.error.js';
import { ACCESS_TOKEN_SERVICE } from '@/modules/user/application/contracts/access-token.contract.js';
import type { AccessTokenService } from '@/modules/user/application/contracts/access-token.contract.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import type { PasswordHasher } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { SESSION_SETTINGS } from '@/modules/user/application/contracts/session-settings.contract.js';
import type { SessionSettings } from '@/modules/user/application/contracts/session-settings.contract.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

/** A mesma mensagem para e-mail inexistente e senha errada (RN-ACE-02). */
export const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  expiresAt: Date;
  user: User;
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);
  private dummyPasswordHash?: Promise<string>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
    @Inject(SESSION_SETTINGS) private readonly sessionSettings: SessionSettings,
  ) {}

  /**
   * Abre uma sessão somente quando as credenciais são válidas e a conta está
   * ativa (RN-ACE-02), registrando o horário do login no usuário.
   */
  async execute(input: LoginInput): Promise<LoginResult> {
    try {
      const user = await this.users.findByEmail(
        input.email.trim().toLowerCase(),
      );
      // A senha é conferida mesmo quando o e-mail não existe, para que o tempo
      // de resposta não revele quais e-mails estão cadastrados.
      const passwordMatches = await this.passwordHasher.verify(
        input.password,
        user?.passwordHash ?? (await this.getDummyPasswordHash()),
      );

      if (!user || !passwordMatches) {
        throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);
      }

      if (!user.canAuthenticate()) {
        throw new AccessDeniedError(
          `Usuário com status ${user.status} não pode autenticar-se no sistema.`,
        );
      }

      const now = new Date();
      const session = Session.start({
        userId: user.id,
        durationInSeconds: this.sessionSettings.durationInSeconds,
        startedAt: now,
      });

      user.registerLogin(now);
      await this.sessions.create(session);
      const authenticatedUser = await this.users.update(user);

      return {
        accessToken: await this.accessTokens.issue(
          { userId: user.id, sessionId: session.id },
          session.expiresAt,
        ),
        expiresAt: session.expiresAt,
        user: authenticatedUser,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao autenticar o usuário: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private getDummyPasswordHash(): Promise<string> {
    this.dummyPasswordHash ??= this.passwordHasher.hash(randomUUID());
    return this.dummyPasswordHash;
  }
}
