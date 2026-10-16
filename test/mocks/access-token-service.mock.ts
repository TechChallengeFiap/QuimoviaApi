import type {
  AccessTokenClaims,
  AccessTokenService,
} from '@/modules/user/application/contracts/access-token.contract.js';

/** Token falso e legível, apenas para tornar os testes determinísticos. */
export class AccessTokenServiceMock implements AccessTokenService {
  async issue(claims: AccessTokenClaims, expiresAt: Date): Promise<string> {
    return `token:${claims.userId}:${claims.sessionId}:${expiresAt.getTime()}`;
  }

  async verify(token: string): Promise<AccessTokenClaims | null> {
    const [prefix, userId, sessionId, expiresAt] = token.split(':');

    if (
      prefix !== 'token' ||
      !userId ||
      !sessionId ||
      Number(expiresAt) <= Date.now()
    ) {
      return null;
    }

    return { userId, sessionId };
  }
}
