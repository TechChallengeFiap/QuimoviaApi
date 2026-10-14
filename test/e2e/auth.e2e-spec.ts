import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import request from 'supertest';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/config/auth.config.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import { PasswordHasherMock } from '../mocks/password-hasher.mock.js';
import { ProtectedRouteModule } from '../mocks/protected-route.mock.js';
import { SessionRepositoryMock } from '../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';
import { createPrismaServiceStub } from '../mocks/prisma-service.mock.js';

const PASSWORD = 'S3nhaForte!';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let users: UserRepositoryMock;
  let sessions: SessionRepositoryMock;

  beforeEach(async () => {
    // Os casos de uso registram os erros esperados (401, 403) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProtectedRouteModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaServiceStub())
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

  /** Lê o id da sessão (claim sid) de um token de acesso. */
  function sessionIdOf(accessToken: string): string {
    const [, payload] = accessToken.split('.');

    return JSON.parse(Buffer.from(payload, 'base64url').toString()).sid;
  }

  function login(email: string, password = PASSWORD) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
  }

  describe('POST /auth/login', () => {
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
        .post('/auth/login')
        .send({ email: 'nao-e-email', password: '' })
        .expect(400);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'maria@quimovia.com', password: PASSWORD, admin: true })
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('encerra a sessão atual, que deixa de valer, sem afetar as outras', async () => {
      await registerUser('maria@quimovia.com');
      const first = (await login('maria@quimovia.com').expect(200)).body
        .accessToken as string;
      const second = (await login('maria@quimovia.com').expect(200)).body
        .accessToken as string;

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${first}`)
        .expect(204);

      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Bearer ${first}`)
        .expect(401);
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${first}`)
        .expect(401);
      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Bearer ${second}`)
        .expect(200);
    });

    it('exige o token de acesso', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('bloqueio e inativação de usuários', () => {
    it.each([
      [UserStatus.BLOCKED, UserStatus.ACTIVE],
      [UserStatus.INACTIVE, UserStatus.ACTIVE],
    ])(
      'invalida as sessões ao mudar para %s, sem reativá-las ao voltar para %s',
      async (status, reactivatedStatus) => {
        const maria = await registerUser('maria@quimovia.com');
        const mariaToken = (await login('maria@quimovia.com').expect(200)).body
          .accessToken as string;

        await request(app.getHttpServer())
          .patch(`/usuarios/${maria.id}`)
          .send({ status })
          .expect(200);
        // Sem nenhuma requisição com o token no meio: quem encerra a sessão é
        // a atualização do usuário, não o guard.
        expect(
          (await sessions.findById(sessionIdOf(mariaToken)))?.endedAt,
        ).toEqual(expect.any(Date));
        await login('maria@quimovia.com').expect(403);

        await request(app.getHttpServer())
          .patch(`/usuarios/${maria.id}`)
          .send({ status: reactivatedStatus })
          .expect(200);
        await request(app.getHttpServer())
          .get('/rota-protegida')
          .set('Authorization', `Bearer ${mariaToken}`)
          .expect(401);

        const newToken = (await login('maria@quimovia.com').expect(200)).body
          .accessToken as string;
        await request(app.getHttpServer())
          .get('/rota-protegida')
          .set('Authorization', `Bearer ${newToken}`)
          .expect(200);
      },
    );
  });

  describe('rotas protegidas pelo AuthGuard', () => {
    async function accessTokenOf(email: string): Promise<string> {
      await registerUser(email);
      const response = await login(email).expect(200);

      return response.body.accessToken as string;
    }

    it('exige o token de acesso', async () => {
      const response = await request(app.getHttpServer())
        .get('/rota-protegida')
        .expect(401);

      expect(response.body).toEqual({
        message:
          'Token de acesso não informado. Envie o cabeçalho Authorization: Bearer <token>.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('libera a rota com o token de uma sessão ativa e expõe a sessão', async () => {
      const token = await accessTokenOf('maria@quimovia.com');
      const user = await users.findByEmail('maria@quimovia.com');

      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            userId: user?.id,
            sessionId: sessionIdOf(token),
            role: UserRole.PORT_OPERATOR,
          });
        });
    });

    it('não protege as rotas em que não é aplicado', async () => {
      await request(app.getHttpServer()).get('/usuarios').expect(200);
    });

    it('recusa um token inválido ou de outro esquema', async () => {
      const token = await accessTokenOf('maria@quimovia.com');

      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Bearer ${token}x`)
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toBe(
            'Token de acesso inválido ou expirado; faça login novamente.',
          );
        });
      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Basic ${token}`)
        .expect(401);
    });

    it('recusa o token quando a conta perde o acesso fora da API, encerrando a sessão', async () => {
      const token = await accessTokenOf('maria@quimovia.com');
      const user = await users.findByEmail('maria@quimovia.com');
      user?.block();

      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toBe(
            'Sessão expirada ou encerrada; faça login novamente.',
          );
        });

      user?.unblock();
      await request(app.getHttpServer())
        .get('/rota-protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
