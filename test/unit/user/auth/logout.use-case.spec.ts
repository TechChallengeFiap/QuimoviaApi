import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { LogoutUseCase } from '@/modules/user/application/use-cases/auth/logout.use-case.js';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { SessionRepositoryMock } from '../../../mocks/session-repository.mock.js';
import { buildSession } from '../../../mocks/entities.mock.js';

describe('LogoutUseCase', () => {
  let sessions: SessionRepositoryMock;
  let useCase: LogoutUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    sessions = new SessionRepositoryMock();
    useCase = new LogoutUseCase(sessions);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function startSession(): Promise<Session> {
    return sessions.create(
      buildSession(),
    );
  }

  it('encerra apenas a sessão informada', async () => {
    const current = await startSession();
    const other = await startSession();

    await useCase.execute(current.id);

    expect((await sessions.findById(current.id))?.isActive()).toBe(false);
    expect((await sessions.findById(other.id))?.isActive()).toBe(true);
  });

  it('lança erro quando a sessão não existe', async () => {
    await expect(useCase.execute('sessao-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const session = await startSession();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(sessions, 'update').mockRejectedValueOnce(failure);

    await expect(useCase.execute(session.id)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao encerrar a sessão com id ${session.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
