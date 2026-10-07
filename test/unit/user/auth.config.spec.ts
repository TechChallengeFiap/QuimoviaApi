import {
  DEFAULT_SESSION_DURATION_IN_SECONDS,
  loadAuthConfig,
} from '@/modules/user/infrastructure/auth/auth.config.js';

describe('loadAuthConfig', () => {
  const secret = 'segredo-de-teste-com-mais-de-32-caracteres';

  it('lê o segredo e usa a duração padrão quando ela não é informada', () => {
    expect(loadAuthConfig({ JWT_SECRET: secret })).toEqual({
      jwtSecret: secret,
      sessionDurationInSeconds: DEFAULT_SESSION_DURATION_IN_SECONDS,
    });
  });

  it('lê a duração das sessões em segundos', () => {
    expect(
      loadAuthConfig({ JWT_SECRET: secret, JWT_EXPIRES_IN_SECONDS: '900' }),
    ).toMatchObject({ sessionDurationInSeconds: 900 });
  });

  it.each([undefined, '', 'curto-demais'])(
    'não aceita o JWT_SECRET %p',
    (jwtSecret) => {
      expect(() => loadAuthConfig({ JWT_SECRET: jwtSecret })).toThrow(
        'A variável de ambiente JWT_SECRET é obrigatória e deve ter ao menos 32 caracteres.',
      );
    },
  );

  it.each(['0', '-60', '1.5', 'uma-hora'])(
    'não aceita o JWT_EXPIRES_IN_SECONDS %p',
    (duration) => {
      expect(() =>
        loadAuthConfig({
          JWT_SECRET: secret,
          JWT_EXPIRES_IN_SECONDS: duration,
        }),
      ).toThrow(
        'A variável de ambiente JWT_EXPIRES_IN_SECONDS deve ser um número inteiro de segundos maior que zero.',
      );
    },
  );
});
