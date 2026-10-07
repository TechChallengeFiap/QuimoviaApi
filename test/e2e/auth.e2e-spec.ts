import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { AuthModule } from '@/modules/user/auth.module.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import { PasswordHasherMock } from '../mocks/password-hasher.mock.js';
import { SessionRepositoryMock } from '../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';

const PASSWORD = 'S3nhaForte!';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let users: UserRepositoryMock;
  let sessions: SessionRepositoryMock;

  beforeEach(async () => {
    // Os casos de uso registram os erros esperados (401, 403) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(SESSION_REPOSITORY)
      .useClass(SessionRepositoryMock)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();

    users = app.get(USER_REPOSITORY);
    sessions = app.get(SESSION_REPOSITORY);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  async function registerUser(
    email: string,
    status = UserStatus.ACTIVE,
  ): Promise<User> {
    return users.create(
      User.create({
        name: 'Maria Silva',
        email,
        passwordHash: `hash:${PASSWORD}`,
        role: UserRole.PORT_OPERATOR,
        status,
      }),
    );
  }

  function login(email: string, password = PASSWORD) {
    return request(app.getHttpServer())
      .post('/autenticacao/login')
      .send({ email, password });
  }

  describe('POST /autenticacao/login', () => {
    it('inicia uma sessão e devolve o token, sem expor o hash da senha', async () => {
      const user = await registerUser('maria@quimovia.com');

      const response = await login('MARIA@quimovia.com').expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresAt: expect.any(String),
        user: {
          id: user.id,
          email: 'maria@quimovia.com',
          status: 'ACTIVE',
          lastLoginAt: expect.any(String),
        },
      });
      expect(response.body.user.passwordHash).toBeUndefined();

      const expiresIn =
        new Date(response.body.expiresAt as string).getTime() - Date.now();
      expect(expiresIn).toBeGreaterThan(3590 * 1000);
      expect(expiresIn).toBeLessThanOrEqual(3600 * 1000);
    });

    it('responde 401 com a mesma mensagem para senha errada e e-mail inexistente', async () => {
      await registerUser('maria@quimovia.com');
      const expected = {
        message: 'E-mail ou senha inválidos.',
        error: 'Unauthorized',
        statusCode: 401,
      };

      const wrongPassword = await login('maria@quimovia.com', 'errada').expect(
        401,
      );
      const unknownEmail = await login('ninguem@quimovia.com').expect(401);

      expect(wrongPassword.body).toEqual(expected);
      expect(unknownEmail.body).toEqual(expected);
    });

    it.each([UserStatus.INACTIVE, UserStatus.BLOCKED])(
      'responde 403 para uma conta %s e não inicia sessão',
      async (status) => {
        await registerUser('maria@quimovia.com', status);
        const createSession = jest.spyOn(sessions, 'create');

        const response = await login('maria@quimovia.com').expect(403);

        expect(response.body.message).toBe(
          `Usuário com status ${status} não pode autenticar-se no sistema.`,
        );
        expect(createSession).not.toHaveBeenCalled();
      },
    );

    it('valida o corpo da requisição', async () => {
      await request(app.getHttpServer())
        .post('/autenticacao/login')
        .send({ email: 'nao-e-email', password: '' })
        .expect(400);
      await request(app.getHttpServer())
        .post('/autenticacao/login')
        .send({ email: 'maria@quimovia.com', password: PASSWORD, admin: true })
        .expect(400);
    });
  });
});
