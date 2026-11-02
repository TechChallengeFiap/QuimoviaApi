import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
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

  describe('com o e-mail de um usuário excluído', () => {
    it('reativa o cadastro excluído com os novos dados, sem criar outro registro', async () => {
      const deleted = await useCase.execute(input);
      deleted.delete();
      await users.update(deleted);
      const create = jest.spyOn(users, 'create');

      const user = await useCase.execute({
        ...input,
        email: ' MARIA@quimovia.com ',
        name: 'Maria Souza',
        password: 'N0vaS3nhaForte!',
        role: UserRole.TECHNICAL_MANAGER,
        status: UserStatus.INACTIVE,
      });

      expect(create).not.toHaveBeenCalled();
      expect(user.id).toBe(deleted.id);
      expect(user).toMatchObject({
        name: 'Maria Souza',
        email: 'maria@quimovia.com',
        passwordHash: 'hash:N0vaS3nhaForte!',
        role: UserRole.TECHNICAL_MANAGER,
        status: UserStatus.INACTIVE,
        isDeleted: false,
      });
      expect((await users.findById(deleted.id))?.name).toBe('Maria Souza');
    });

    it('registra o erro no log e o propaga quando a reativação falha', async () => {
      const deleted = await useCase.execute(input);
      deleted.delete();
      await users.update(deleted);
      const failure = new Error('Falha de conexão com o banco');
      jest.spyOn(users, 'update').mockRejectedValueOnce(failure);

      await expect(useCase.execute(input)).rejects.toBe(failure);
      expect(loggerError).toHaveBeenCalledWith(
        'Erro ao cadastrar o usuário: Falha de conexão com o banco',
        failure.stack,
      );
    });
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
