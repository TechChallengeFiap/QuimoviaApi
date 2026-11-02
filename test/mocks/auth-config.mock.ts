import type { AuthConfig } from '@/modules/user/infrastructure/auth/auth.config.js';

/** Configuração de autenticação dos testes, sem depender do .env. */
export const TEST_AUTH_CONFIG: AuthConfig = {
  jwtSecret: 'segredo-dos-testes-com-mais-de-32-caracteres',
  sessionDurationInSeconds: 3600,
};
