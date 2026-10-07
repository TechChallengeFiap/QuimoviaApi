import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { LoginUseCase } from '@/modules/user/application/use-cases/auth/login.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  AccessDeniedError,
  AuthenticationError,
} from '@/shared/domain/errors/domain.error.js';
import { AccessTokenServiceMock } from '../../../mocks/access-token-service.mock.js';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { SessionRepositoryMock } from '../../../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('LoginUseCase', () => {
  let users: UserRepositoryMock;
  let sessions: SessionRepositoryMock;
  let passwordHasher: PasswordHasherMock;
  let accessTokens: AccessTokenServiceMock;
  let useCase: LoginUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    sessions = new SessionRepositoryMock();
    passwordHasher = new PasswordHasherMock();
    accessTokens = new AccessTokenServiceMock();
    useCase = new LoginUseCase(users, sessions, passwordHasher, accessTokens, {
      durationInSeconds: 3600,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerUser(status = UserStatus.ACTIVE): Promise<User> {
    return users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        passwordHash: 'hash:S3nhaForte!',
        role: UserRole.PORT_OPERATOR,
        status,
      }),
    );
  }

  it('inicia uma sessão e devolve o token de acesso dela', async () => {
    const user = await registerUser();
    const before = Date.now();

    const result = await useCase.execute({
      email: 'maria@quimovia.com',
      password: 'S3nhaForte!',
    });

    const claims = await accessTokens.verify(result.accessToken);
    const session = await sessions.findById(claims?.sessionId ?? '');

    expect(claims?.userId).toBe(user.id);
    expect(session?.userId).toBe(user.id);
    expect(session?.isActive()).toBe(true);
    expect(result.expiresAt).toEqual(session?.expiresAt);
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 3600 * 1000,
    );
  });

  it('registra o horário do login no usuário', async () => {
    await registerUser();

    const { user } = await useCase.execute({
      email: 'maria@quimovia.com',
      password: 'S3nhaForte!',
    });

    expect(user.lastLoginAt).toEqual(expect.any(Date));
    expect(
      (await users.findByEmail('maria@quimovia.com'))?.lastLoginAt,
    ).toEqual(user.lastLoginAt);
  });

  it('compara o e-mail sem diferenciar maiúsculas e espaços nas pontas', async () => {
    await registerUser();

    await expect(
      useCase.execute({
        email: '  Maria@Quimovia.COM ',
        password: 'S3nhaForte!',
      }),
    ).resolves.toMatchObject({ accessToken: expect.any(String) });
  });

  it('recusa a senha errada sem iniciar sessão', async () => {
    await registerUser();
    const createSession = jest.spyOn(sessions, 'create');

    await expect(
      useCase.execute({ email: 'maria@quimovia.com', password: 'errada' }),
    ).rejects.toThrow(new AuthenticationError('E-mail ou senha inválidos.'));
    expect(createSession).not.toHaveBeenCalled();
  });

  it('recusa um e-mail não cadastrado com a mesma mensagem, conferindo a senha mesmo assim', async () => {
    const verify = jest.spyOn(passwordHasher, 'verify');

    await expect(
      useCase.execute({
        email: 'ninguem@quimovia.com',
        password: 'S3nhaForte!',
      }),
    ).rejects.toThrow(new AuthenticationError('E-mail ou senha inválidos.'));
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it.each([UserStatus.INACTIVE, UserStatus.BLOCKED])(
    'recusa a conta %s, sem iniciar sessão nem registrar o login',
    async (status) => {
      await registerUser(status);
      const createSession = jest.spyOn(sessions, 'create');

      await expect(
        useCase.execute({
          email: 'maria@quimovia.com',
          password: 'S3nhaForte!',
        }),
      ).rejects.toThrow(
        new AccessDeniedError(
          `Usuário com status ${status} não pode autenticar-se no sistema.`,
        ),
      );
      expect(createSession).not.toHaveBeenCalled();
      expect(
        (await users.findByEmail('maria@quimovia.com'))?.lastLoginAt,
      ).toBeNull();
    },
  );

  it('não revela o status de uma conta bloqueada para quem erra a senha', async () => {
    await registerUser(UserStatus.BLOCKED);

    await expect(
      useCase.execute({ email: 'maria@quimovia.com', password: 'errada' }),
    ).rejects.toThrow(AuthenticationError);
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(sessions, 'create').mockRejectedValueOnce(failure);

    await expect(
      useCase.execute({
        email: 'maria@quimovia.com',
        password: 'S3nhaForte!',
      }),
    ).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao autenticar o usuário: Falha de conexão com o banco',
      failure.stack,
    );
  });
});
