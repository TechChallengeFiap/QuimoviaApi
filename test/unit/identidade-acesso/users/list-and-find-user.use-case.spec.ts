import { FindUserByIdUseCase } from '../../../../src/modules/identidade-acesso/application/use-cases/users/find-user-by-id.use-case.js';
import { ListUsersUseCase } from '../../../../src/modules/identidade-acesso/application/use-cases/users/list-users.use-case.js';
import { User } from '../../../../src/modules/identidade-acesso/domain/entities/user.entity.js';
import { UserRole } from '../../../../src/modules/identidade-acesso/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '../../../../src/shared/domain/errors/domain.error.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('FindUserByIdUseCase', () => {
  it('lança erro quando o usuário não existe', async () => {
    const useCase = new FindUserByIdUseCase(new UserRepositoryMock());

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
  });

  it('retorna o usuário quando ele existe', async () => {
    const users = new UserRepositoryMock();
    const user = await users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
      }),
    );

    const useCase = new FindUserByIdUseCase(users);

    await expect(useCase.execute(user.id)).resolves.toBe(user);
  });
});

describe('ListUsersUseCase', () => {
  it('aplica os valores padrão de paginação', async () => {
    const users = new UserRepositoryMock();
    const useCase = new ListUsersUseCase(users);

    const result = await useCase.execute();

    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('filtra por perfil', async () => {
    const users = new UserRepositoryMock();
    await users.create(
      User.create({
        name: 'Operador',
        email: 'operador@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
      }),
    );
    await users.create(
      User.create({
        name: 'Gestor',
        email: 'gestor@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.OPERATIONS_MANAGER,
      }),
    );

    const useCase = new ListUsersUseCase(users);
    const result = await useCase.execute({ role: UserRole.OPERATIONS_MANAGER });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.role).toBe(UserRole.OPERATIONS_MANAGER);
  });
});
