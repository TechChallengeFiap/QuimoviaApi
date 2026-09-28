import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { UpdateUserUseCase } from '@/modules/user/application/use-cases/users/update-user.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('UpdateUserUseCase', () => {
  let users: UserRepositoryMock;
  let useCase: UpdateUserUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    useCase = new UpdateUserUseCase(users, new PasswordHasherMock());
  });

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
