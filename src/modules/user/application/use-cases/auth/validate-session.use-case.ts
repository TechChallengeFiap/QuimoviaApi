import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { AuthenticationError } from '@/shared/domain/errors/domain.error.js';
import { ACCESS_TOKEN_SERVICE } from '@/modules/user/application/contracts/access-token.contract.js';
import type { AccessTokenService } from '@/modules/user/application/contracts/access-token.contract.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import type { SessionRepository } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';

export const INVALID_ACCESS_TOKEN_MESSAGE =
  'Token de acesso inválido ou expirado; faça login novamente.';
export const ENDED_SESSION_MESSAGE =
  'Sessão expirada ou encerrada; faça login novamente.';

/** Usuário e sessão de uma requisição autenticada. */
export interface AuthenticatedSession {
  userId: string;
  sessionId: string;
  role: UserRole;
}

@Injectable()
export class ValidateSessionUseCase {
  private readonly logger = new Logger(ValidateSessionUseCase.name);

  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  /**
   * Confere a cada requisição se o token é válido, se a sessão dele continua
   * ativa e se o usuário ainda tem acesso (RN-ACE-03). Usa a situação e o
   * perfil atuais do usuário, não os do momento do login (RN-ACE-04).
   */
  async execute(token: string): Promise<AuthenticatedSession> {
    try {
      const claims = await this.accessTokens.verify(token);

      if (!claims) {
        throw new AuthenticationError(INVALID_ACCESS_TOKEN_MESSAGE);
      }

      const session = await this.sessions.findById(claims.sessionId);

      if (!session || session.userId !== claims.userId || !session.isActive()) {
        throw new AuthenticationError(ENDED_SESSION_MESSAGE);
      }

      const user = await this.users.findById(session.userId);

      // Uma conta inativada ou bloqueada invalida a sessão, que não volta a
      // valer nem se a conta for reativada.
      if (!user || !user.canAuthenticate()) {
        session.end();
        await this.sessions.update(session);
        throw new AuthenticationError(ENDED_SESSION_MESSAGE);
      }

      return { userId: user.id, sessionId: session.id, role: user.role };
    } catch (error) {
      this.logger.error(
        `Erro ao validar a sessão do token de acesso: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
