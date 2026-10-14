import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.ts';
import { Session } from '@/modules/user/domain/entities/session.entity.js';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { SessionRepositoryMock } from '../../../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('UpdateUserUseCase', () => {
  let users: UserRepositoryMock;
  let sessions: SessionRepositoryMock;
  let useCase: UpdateUserUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    sessions = new SessionRepositoryMock();
    useCase = new UpdateUserUseCase(users, new PasswordHasherMock(), sessions);
  });

  function startSession(userId: string): Promise<Session> {
    return sessions.create(Session.start({ userId, durationInSeconds: 3600 }));
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerUser(email = 'maria@quimovia.com'): Promise<User> {
    const user = User.create({
      name: 'Maria Silva',
      email,
      passwordHash: 'hash:old',
      role: UserRole.PORT_OPERATOR,
    });

    return users.create(user);
  }

  it('lança erro quando o usuário não existe', async () => {
    await expect(
      useCase.execute('id-inexistente', { name: 'Novo Nome' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('atualiza nome, perfil e status', async () => {
    const user = await registerUser();

    const updated = await useCase.execute(user.id, {
      name: 'Maria Souza',
      role: UserRole.OPERATIONS_MANAGER,
      status: UserStatus.INACTIVE,
    });

    expect(updated.name).toBe('Maria Souza');
    expect(updated.role).toBe(UserRole.OPERATIONS_MANAGER);
    expect(updated.status).toBe(UserStatus.INACTIVE);
  });

  it('rejeita alterar para um e-mail já usado por outro usuário', async () => {
    await registerUser('taken@quimovia.com');
    const user = await registerUser('free@quimovia.com');

    await expect(
      useCase.execute(user.id, { email: 'taken@quimovia.com' }),
    ).rejects.toThrow(ConflictError);
  });

  it('desbloqueia corretamente ao pedir status ACTIVE para um usuário bloqueado', async () => {
    const user = await registerUser();
    user.block();
    await users.update(user);

    const updated = await useCase.execute(user.id, {
      status: UserStatus.ACTIVE,
    });

    expect(updated.status).toBe(UserStatus.ACTIVE);
  });

  it.each([UserStatus.BLOCKED, UserStatus.INACTIVE])(
    'encerra as sessões abertas do usuário ao mudar o status para %s',
    async (status) => {
      const user = await registerUser();
      const other = await registerUser('outro@quimovia.com');
      const session = await startSession(user.id);
      const otherSession = await startSession(other.id);

      await useCase.execute(user.id, { status });

      expect(session.isActive()).toBe(false);
      expect(otherSession.isActive()).toBe(true);
    },
  );

  it('não reativa as sessões encerradas ao desbloquear o usuário', async () => {
    const user = await registerUser();
    const session = await startSession(user.id);

    await useCase.execute(user.id, { status: UserStatus.BLOCKED });
    await useCase.execute(user.id, { status: UserStatus.ACTIVE });

    expect(session.isActive()).toBe(false);
  });

  it('não grava o bloqueio quando o encerramento das sessões falha', async () => {
    const user = await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(sessions, 'endAllByUserId').mockRejectedValueOnce(failure);
    const update = jest.spyOn(users, 'update');

    await expect(
      useCase.execute(user.id, { status: UserStatus.BLOCKED }),
    ).rejects.toBe(failure);
    expect(update).not.toHaveBeenCalled();
  });

  it('mantém as sessões quando o usuário continua com acesso', async () => {
    const user = await registerUser();
    const session = await startSession(user.id);
    const endAll = jest.spyOn(sessions, 'endAllByUserId');

    await useCase.execute(user.id, {
      name: 'Maria Souza',
      role: UserRole.OPERATIONS_MANAGER,
      status: UserStatus.ACTIVE,
    });

    expect(endAll).not.toHaveBeenCalled();
    expect(session.isActive()).toBe(true);
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const user = await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(users, 'update').mockRejectedValueOnce(failure);

    await expect(
      useCase.execute(user.id, { name: 'Maria Souza' }),
    ).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao atualizar o usuário com id ${user.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
