import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CreateUserUseCase } from '@/modules/user/application/use-cases/users/create-user.use-case.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  DEFAULT_ADMIN_NAME,
  loadInitialAdminConfig,
  seedInitialAdmin,
} from '@/modules/user/infrastructure/persistence/prisma/seed/initial-admin.seed.js';
import { PasswordHasherMock } from '../../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';

describe('seed do administrador inicial', () => {
  describe('loadInitialAdminConfig', () => {
    it('lê o administrador das variáveis de ambiente', () => {
      expect(
        loadInitialAdminConfig({
          ADMIN_NAME: ' Ana Admin ',
          ADMIN_EMAIL: ' admin@quimovia.com ',
          ADMIN_PASSWORD: 'S3nhaForte!',
        }),
      ).toEqual({
        name: 'Ana Admin',
        email: 'admin@quimovia.com',
        password: 'S3nhaForte!',
      });
    });

    it('usa um nome padrão quando ADMIN_NAME não é informado', () => {
      expect(
        loadInitialAdminConfig({
          ADMIN_EMAIL: 'admin@quimovia.com',
          ADMIN_PASSWORD: 'S3nhaForte!',
        }).name,
      ).toBe(DEFAULT_ADMIN_NAME);
    });

    it('exige o ADMIN_EMAIL', () => {
      expect(() =>
        loadInitialAdminConfig({ ADMIN_PASSWORD: 'S3nhaForte!' }),
      ).toThrow(
        'A variável de ambiente ADMIN_EMAIL é obrigatória para criar o administrador inicial.',
      );
    });

    it.each([undefined, '', 'curta'])(
      'não aceita o ADMIN_PASSWORD %p',
      (password) => {
        expect(() =>
          loadInitialAdminConfig({
            ADMIN_EMAIL: 'admin@quimovia.com',
            ADMIN_PASSWORD: password,
          }),
        ).toThrow(
          'A variável de ambiente ADMIN_PASSWORD é obrigatória e deve ter ao menos 8 caracteres.',
        );
      },
    );
  });

  describe('seedInitialAdmin', () => {
    let users: UserRepositoryMock;
    let createUserUseCase: CreateUserUseCase;

    const config = {
      name: 'Ana Admin',
      email: 'Admin@Quimovia.com',
      password: 'S3nhaForte!',
    };

    beforeEach(() => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      users = new UserRepositoryMock();
      createUserUseCase = new CreateUserUseCase(
        users,
        new PasswordHasherMock(),
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('cria um Administrador do Sistema ativo, com a senha em hash', async () => {
      const result = await seedInitialAdmin(users, createUserUseCase, config);

      expect(result.created).toBe(true);
      expect(result.user).toMatchObject({
        name: 'Ana Admin',
        email: 'admin@quimovia.com',
        role: UserRole.SYSTEM_ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash: 'hash:S3nhaForte!',
      });
    });

    it('mantém o usuário existente quando o e-mail já está cadastrado', async () => {
      const existing = await users.create(
        User.create({
          name: 'Maria Silva',
          email: 'admin@quimovia.com',
          passwordHash: 'hash:outra',
          role: UserRole.PORT_OPERATOR,
        }),
      );
      const execute = jest.spyOn(createUserUseCase, 'execute');

      const result = await seedInitialAdmin(users, createUserUseCase, config);

      expect(result).toEqual({ created: false, user: existing });
      expect(execute).not.toHaveBeenCalled();
    });
  });
});
