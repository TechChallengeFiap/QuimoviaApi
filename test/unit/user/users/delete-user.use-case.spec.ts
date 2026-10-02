import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { DeleteUserUseCase } from '@/modules/user/application/use-cases/users/delete-user.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('DeleteUserUseCase', () => {
  let users: UserRepositoryMock;
  let useCase: DeleteUserUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    useCase = new DeleteUserUseCase(users);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerUser(): Promise<User> {
    return users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
      }),
    );
  }

  it('lança erro quando o usuário não existe', async () => {
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('remove um usuário existente', async () => {
    const user = await registerUser();

    await useCase.execute(user.id);

    await expect(users.findById(user.id)).resolves.toBeNull();
  });

  it('registra o erro no log e o propaga quando a remoção falha', async () => {
    const user = await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(users, 'remove').mockRejectedValueOnce(failure);

    await expect(useCase.execute(user.id)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao remover o usuário com id ${user.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
