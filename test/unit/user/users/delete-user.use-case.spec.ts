import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { SessionRepositoryMock } from '../../../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('DeleteUserUseCase', () => {
  let users: UserRepositoryMock;
  let sessions: SessionRepositoryMock;
  let useCase: DeleteUserUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    sessions = new SessionRepositoryMock();
    useCase = new DeleteUserUseCase(users, sessions);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerUser(email = 'maria@quimovia.com'): Promise<User> {
    return users.create(
      User.create({
        name: 'Maria Silva',
        email,
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
      }),
    );
  }

  function startSession(userId: string): Promise<Session> {
    return sessions.create(Session.start({ userId, durationInSeconds: 3600 }));
  }

  it('lança erro quando o usuário não existe', async () => {
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('exclui o usuário logicamente: some das buscas, mas o registro continua', async () => {
    const user = await registerUser();

    await useCase.execute(user.id);

    await expect(users.findById(user.id)).resolves.toBeNull();
    const stored = await users.findByEmailIncludingDeleted(user.email);
    expect(stored?.id).toBe(user.id);
    expect(stored?.isDeleted).toBe(true);
    expect(stored?.deletedAt).toEqual(expect.any(Date));
  });

  it('retorna 404 ao excluir de novo um usuário já excluído', async () => {
    const user = await registerUser();
    await useCase.execute(user.id);

    await expect(useCase.execute(user.id)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('encerra só as sessões do usuário excluído', async () => {
    const user = await registerUser();
    const other = await registerUser('outro@quimovia.com');
    const session = await startSession(user.id);
    const otherSession = await startSession(other.id);

    await useCase.execute(user.id);

    expect(session.isActive()).toBe(false);
    expect(otherSession.isActive()).toBe(true);
  });

  it('não grava a exclusão quando o encerramento das sessões falha', async () => {
    const user = await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(sessions, 'endAllByUserId').mockRejectedValueOnce(failure);
    const update = jest.spyOn(users, 'update');

    await expect(useCase.execute(user.id)).rejects.toBe(failure);
    expect(update).not.toHaveBeenCalled();
  });

  it('registra o erro no log e o propaga quando a gravação falha', async () => {
    const user = await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(users, 'update').mockRejectedValueOnce(failure);

    await expect(useCase.execute(user.id)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao remover o usuário com id ${user.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
