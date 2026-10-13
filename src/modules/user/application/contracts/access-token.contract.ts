/** Dados que identificam o acesso dentro do token. */
export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
}

/**
 * Porta de emissão e validação dos tokens de acesso.
 *
 * Mantém o formato do token (JWT) fora dos casos de uso.
 */
export interface AccessTokenService {
  /** Gera o token de uma sessão, válido até o fim dela. */
  issue(claims: AccessTokenClaims, expiresAt: Date): Promise<string>;
  /** Retorna os dados do token, ou null quando ele é inválido ou expirou. */
  verify(token: string): Promise<AccessTokenClaims | null>;
}

export const ACCESS_TOKEN_SERVICE = Symbol('AccessTokenService');
