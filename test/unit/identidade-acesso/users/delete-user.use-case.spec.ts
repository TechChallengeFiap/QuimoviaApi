import { DeleteUserUseCase } from '../../../../src/modules/identidade-acesso/application/use-cases/users/delete-user.use-case.js';
import { User } from '../../../../src/modules/identidade-acesso/domain/entities/user.entity.js';
import { UserRole } from '../../../../src/modules/identidade-acesso/domain/enums/user-role.enum.js';
import { ResourceNotFoundError } from '../../../../src/shared/domain/errors/domain.error.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('DeleteUserUseCase', () => {
  it('lança erro quando o usuário não existe', async () => {
    const useCase = new DeleteUserUseCase(new UserRepositoryMock());

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
  });

  it('remove um usuário existente', async () => {
    const users = new UserRepositoryMock();
    const user = await users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
      }),
    );

    const useCase = new DeleteUserUseCase(users);
    await useCase.execute(user.id);

    await expect(users.findById(user.id)).resolves.toBeNull();
  });
});
