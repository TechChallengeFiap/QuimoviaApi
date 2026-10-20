import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { ChangeUserRoleUseCase } from '@/modules/user/application/use-cases/users/change-user-role.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('ChangeUserRoleUseCase', () => {
  let users: UserRepositoryMock;
  let useCase: ChangeUserRoleUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    useCase = new ChangeUserRoleUseCase(users);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerUser(): Promise<User> {
    return users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        passwordHash: 'hash:old',
        role: UserRole.PORT_OPERATOR,
      }),
    );
  }

  it('altera o perfil e grava o usuário', async () => {
    const user = await registerUser();

    const updated = await useCase.execute(user.id, UserRole.OPERATIONS_MANAGER);

    expect(updated.role).toBe(UserRole.OPERATIONS_MANAGER);
    expect((await users.findById(user.id))?.role).toBe(
      UserRole.OPERATIONS_MANAGER,
    );
  });

  it('lança erro quando o usuário não existe', async () => {
    await expect(
      useCase.execute('id-inexistente', UserRole.SYSTEM_ADMIN),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const user = await registerUser();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(users, 'update').mockRejectedValueOnce(failure);

    await expect(useCase.execute(user.id, UserRole.SYSTEM_ADMIN)).rejects.toBe(
      failure,
    );
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao alterar o perfil do usuário com id ${user.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
