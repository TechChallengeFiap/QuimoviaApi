import { CreateUserUseCase } from '../../../../src/modules/identidade-acesso/application/use-cases/users/create-user.use-case.js';
import { UserRole } from '../../../../src/modules/identidade-acesso/domain/enums/user-role.enum.js';
import { ConflictError } from '../../../../src/shared/domain/errors/domain.error.js';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('CreateUserUseCase', () => {
  let users: UserRepositoryMock;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    users = new UserRepositoryMock();
    useCase = new CreateUserUseCase(users, new PasswordHasherMock());
  });

  it('cria um usuário com a senha em hash', async () => {
    const user = await useCase.execute({
      name: 'Maria Silva',
      email: 'maria@quimovia.com',
      password: 'S3nhaForte!',
      role: UserRole.PORT_OPERATOR,
    });

    expect(user.passwordHash).toBe('hash:S3nhaForte!');
    expect(await users.findById(user.id)).not.toBeNull();
  });

  it('rejeita e-mail já cadastrado', async () => {
    const input = {
      name: 'Maria Silva',
      email: 'maria@quimovia.com',
      password: 'S3nhaForte!',
      role: UserRole.PORT_OPERATOR,
    };

    await useCase.execute(input);

    await expect(useCase.execute({ ...input, name: 'Outra Maria' })).rejects.toThrow(
      ConflictError,
    );
  });
});
