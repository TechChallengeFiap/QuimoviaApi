import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import { PasswordHasherMock } from '../../../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('CreateUserUseCase', () => {
  let users: UserRepositoryMock;
  let useCase: CreateUserUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  const input = {
    name: 'Maria Silva',
    email: 'maria@quimovia.com',
    password: 'S3nhaForte!',
    role: UserRole.PORT_OPERATOR,
  };

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    users = new UserRepositoryMock();
    useCase = new CreateUserUseCase(users, new PasswordHasherMock());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cria um usuário com a senha em hash', async () => {
    const user = await useCase.execute(input);

    expect(user.passwordHash).toBe('hash:S3nhaForte!');
    expect(await users.findById(user.id)).not.toBeNull();
  });

  it('rejeita e-mail já cadastrado', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, name: 'Outra Maria' }),
    ).rejects.toThrow(ConflictError);
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(users, 'create').mockRejectedValueOnce(failure);

    await expect(useCase.execute(input)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao cadastrar o usuário: Falha de conexão com o banco',
      failure.stack,
    );
  });
});
