import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AccessTokenClaims,
  AccessTokenService,
} from '@/modules/user/application/contracts/access-token.contract.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/config/auth.config.js';
import type { AuthConfig } from '@/modules/user/infrastructure/config/auth.config.js';

const ALGORITHM = 'HS256';

interface AccessTokenPayload {
  sub?: unknown;
  sid?: unknown;
}

/**
 * Tokens de acesso no formato JWT (HS256).
 *
 * O token carrega o usuário (sub) e a sessão (sid) e expira junto com a
 * sessão. Como a sessão pode ser encerrada antes do prazo, a validade dela é
 * conferida no banco a cada requisição, além da assinatura do token.
 */
@Injectable()
export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  async issue(claims: AccessTokenClaims, expiresAt: Date): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: claims.userId,
        sid: claims.sessionId,
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      { secret: this.config.jwtSecret, algorithm: ALGORITHM },
    );
  }

  async verify(token: string): Promise<AccessTokenClaims | null> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.jwtSecret,
        algorithms: [ALGORITHM],
      });

      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
        return null;
      }

      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      return null;
    }
  }
}
