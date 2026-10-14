import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import {
  ENDED_SESSION_MESSAGE,
  INVALID_ACCESS_TOKEN_MESSAGE,
  ValidateSessionUseCase,
} from '@/modules/user/application/use-cases/auth/validate-session.use-case.js';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { AuthenticationError } from '@/shared/domain/errors/domain.error.js';
import { AccessTokenServiceMock } from '../../../mocks/access-token-service.mock.js';
import { SessionRepositoryMock } from '../../../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';
import { buildSession, buildUser } from '../../../mocks/entities.mock.js';

describe('ValidateSessionUseCase', () => {
  let users: UserRepositoryMock;
  let sessions: SessionRepositoryMock;
  let accessTokens: AccessTokenServiceMock;
  let useCase: ValidateSessionUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    sessions = new SessionRepositoryMock();
    accessTokens = new AccessTokenServiceMock();
    useCase = new ValidateSessionUseCase(accessTokens, sessions, users);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function loggedInUser(): Promise<{
    user: User;
    session: Session;
    token: string;
  }> {
    const user = await users.create(
      buildUser({ role: UserRole.TECHNICAL_MANAGER }),
    );
    const session = await sessions.create(
      buildSession({ userId: user.id }),
    );
    const token = await accessTokens.issue(
      { userId: user.id, sessionId: session.id },
      session.expiresAt,
    );

    return { user, session, token };
  }

  it('devolve o usuário, a sessão e o perfil atual do usuário', async () => {
    const { user, session, token } = await loggedInUser();
    user.changeRole(UserRole.OPERATIONS_MANAGER);

    await expect(useCase.execute(token)).resolves.toEqual({
      userId: user.id,
      sessionId: session.id,
      role: UserRole.OPERATIONS_MANAGER,
    });
  });

  it('recusa um token inválido ou expirado', async () => {
    await expect(useCase.execute('token-invalido')).rejects.toThrow(
      new AuthenticationError(INVALID_ACCESS_TOKEN_MESSAGE),
    );
  });

  it('recusa o token de uma sessão inexistente', async () => {
    const token = await accessTokens.issue(
      { userId: 'user-001', sessionId: 'sessao-inexistente' },
      new Date(Date.now() + 60_000),
    );

    await expect(useCase.execute(token)).rejects.toThrow(
      new AuthenticationError(ENDED_SESSION_MESSAGE),
    );
  });

  it('recusa o token de uma sessão encerrada', async () => {
    const { session, token } = await loggedInUser();
    session.end();

    await expect(useCase.execute(token)).rejects.toThrow(
      new AuthenticationError(ENDED_SESSION_MESSAGE),
    );
  });

  it('recusa o token de uma sessão expirada', async () => {
    const { user } = await loggedInUser();
    const expired = await sessions.create(
      buildSession({
        userId: user.id,
        durationInSeconds: 60,
        startedAt: new Date(Date.now() - 120_000),
      }),
    );
    // O token ainda vale por mais tempo que a sessão.
    const token = await accessTokens.issue(
      { userId: user.id, sessionId: expired.id },
      new Date(Date.now() + 60_000),
    );

    await expect(useCase.execute(token)).rejects.toThrow(
      new AuthenticationError(ENDED_SESSION_MESSAGE),
    );
  });

  it('recusa um token cujo usuário não é o dono da sessão', async () => {
    const { session } = await loggedInUser();
    const token = await accessTokens.issue(
      { userId: 'outro-usuario', sessionId: session.id },
      session.expiresAt,
    );

    await expect(useCase.execute(token)).rejects.toThrow(
      new AuthenticationError(ENDED_SESSION_MESSAGE),
    );
  });

  it.each(['deactivate', 'block'] as const)(
    'encerra a sessão quando o usuário perdeu o acesso (%s)',
    async (action) => {
      const { user, session, token } = await loggedInUser();
      user[action]();

      await expect(useCase.execute(token)).rejects.toThrow(
        new AuthenticationError(ENDED_SESSION_MESSAGE),
      );
      expect(session.endedAt).toEqual(expect.any(Date));

      // Reativar a conta não reativa a sessão encerrada (RN-ACE-03).
      if (action === 'block') {
        user.unblock();
      } else {
        user.activate();
      }
      await expect(useCase.execute(token)).rejects.toThrow(AuthenticationError);
    },
  );

  it('registra o erro no log e o propaga', async () => {
    const { token } = await loggedInUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(sessions, 'findById').mockRejectedValueOnce(failure);

    await expect(useCase.execute(token)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao validar a sessão do token de acesso: Falha de conexão com o banco',
      failure.stack,
    );
  });
});
