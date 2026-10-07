/** Configuração da autenticação, lida das variáveis de ambiente. */
export interface AuthConfig {
  /** Segredo usado para assinar e validar os tokens de acesso (HS256). */
  jwtSecret: string;
  /** Duração das sessões e dos tokens de acesso, em segundos. */
  sessionDurationInSeconds: number;
}

export const AUTH_CONFIG = Symbol('AuthConfig');

export const DEFAULT_SESSION_DURATION_IN_SECONDS = 3600;

/** O HS256 pede um segredo de pelo menos 256 bits (32 bytes). */
export const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Lê e valida a configuração da autenticação.
 *
 * A aplicação não sobe sem um JWT_SECRET válido, para nunca assinar tokens
 * com um segredo padrão ou fraco.
 */
export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
): AuthConfig {
  const jwtSecret = env.JWT_SECRET?.trim() ?? '';

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `A variável de ambiente JWT_SECRET é obrigatória e deve ter ao menos ${MIN_JWT_SECRET_LENGTH} caracteres.`,
    );
  }

  const configuredDuration = env.JWT_EXPIRES_IN_SECONDS?.trim();
  const sessionDurationInSeconds = configuredDuration
    ? Number(configuredDuration)
    : DEFAULT_SESSION_DURATION_IN_SECONDS;

  if (
    !Number.isInteger(sessionDurationInSeconds) ||
    sessionDurationInSeconds < 1
  ) {
    throw new Error(
      'A variável de ambiente JWT_EXPIRES_IN_SECONDS deve ser um número inteiro de segundos maior que zero.',
    );
  }

  return { jwtSecret, sessionDurationInSeconds };
}
