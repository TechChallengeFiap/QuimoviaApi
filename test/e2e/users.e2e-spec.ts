import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
import { UserModule } from '@/modules/user/user.module.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { loginAsAdmin } from '../mocks/admin-session.mock.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import { PasswordHasherMock } from '../mocks/password-hasher.mock.js';
import { SessionRepositoryMock } from '../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeEach(async () => {
    // Os casos de uso registram os erros esperados (404, 409) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
      .overrideProvider(SESSION_REPOSITORY)
      .useClass(SessionRepositoryMock)
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

    adminToken = await loginAsAdmin(app, app.get(USER_REPOSITORY));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('cria um usuário e não expõe o hash da senha na resposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Maria Silva',
      email: 'maria@quimovia.com',
      role: 'PORT_OPERATOR',
      status: 'ACTIVE',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('rejeita a criação de um usuário com e-mail duplicado', async () => {
    const data = {
      name: 'Maria Silva',
      email: 'duplicado@quimovia.com',
      password: 'S3nhaForte!',
      role: 'PORT_OPERATOR',
    };

    await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(201);
    await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(409);
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ok',
        email: 'invalido',
        password: '123',
        role: 'INEXISTENTE',
      })
      .expect(400);
  });

  it('busca um usuário pelo id e retorna 404 para id inexistente', async () => {
    const created = await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.find@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    await request(app.getHttpServer())
      .get(`/usuarios/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('maria.find@quimovia.com');
      });

    await request(app.getHttpServer())
      .get('/usuarios/id-inexistente')
      .expect(404);
  });

  it('lista usuários paginados', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.list@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    const response = await request(app.getHttpServer())
      .get('/usuarios')
      .expect(200);

    expect(response.body).toMatchObject({ page: 1, pageSize: 20 });
    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('atualiza um usuário, incluindo bloquear e desbloquear', async () => {
    const created = await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.update@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/usuarios/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Maria Souza', status: 'BLOCKED' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Maria Souza');
        expect(body.status).toBe('BLOCKED');
      });

    await request(app.getHttpServer())
      .patch(`/usuarios/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ACTIVE');
      });
  });

  it('remove um usuário e passa a retornar 404 nas buscas seguintes', async () => {
    const created = await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.delete@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    const id = created.body.id as string;

    await request(app.getHttpServer())
      .delete(`/usuarios/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer()).get(`/usuarios/${id}`).expect(404);
  });

  it('retorna 404 ao remover um usuário inexistente', async () => {
    await request(app.getHttpServer())
      .delete('/usuarios/id-inexistente')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  describe('gestão restrita ao Administrador do Sistema', () => {
    const newUser = {
      name: 'Joao Souza',
      email: 'joao@quimovia.com',
      password: 'S3nhaForte!',
      role: 'PORT_OPERATOR',
    };

    async function createUser(
      email: string,
      role = 'PORT_OPERATOR',
    ): Promise<string> {
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...newUser, email, role })
        .expect(201);

      return response.body.id as string;
    }

    async function loginAs(email: string): Promise<string> {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: newUser.password })
        .expect(200);

      return response.body.accessToken as string;
    }

    it('exige o token de acesso para cadastrar, editar e remover', async () => {
      const id = await createUser('maria.auth@quimovia.com');

      await request(app.getHttpServer())
        .post('/usuarios')
        .send(newUser)
        .expect(401);
      await request(app.getHttpServer())
        .patch(`/usuarios/${id}`)
        .send({ status: 'INACTIVE' })
        .expect(401);
      await request(app.getHttpServer()).delete(`/usuarios/${id}`).expect(401);
    });

    it('responde 403 para os outros perfis, sem alterar nada', async () => {
      const id = await createUser(
        'maria.gestora@quimovia.com',
        'OPERATIONS_MANAGER',
      );
      const token = await loginAs('maria.gestora@quimovia.com');

      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/usuarios/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SYSTEM_ADMIN' })
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/usuarios/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        message:
          'O perfil do usuário não tem permissão para executar esta operação.',
        error: 'Forbidden',
        statusCode: 403,
      });
      await request(app.getHttpServer())
        .get(`/usuarios/${id}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.role).toBe('OPERATIONS_MANAGER');
        });
      await request(app.getHttpServer())
        .get('/usuarios')
        .expect(200)
        .expect(({ body }) => {
          expect(
            body.items.map((user: { email: string }) => user.email),
          ).not.toContain(newUser.email);
        });
    });

    it('aplica a troca de perfil já na próxima requisição, sem novo login', async () => {
      const id = await createUser('maria.promovida@quimovia.com');
      const token = await loginAs('maria.promovida@quimovia.com');

      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/usuarios/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SYSTEM_ADMIN' })
        .expect(200);
      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/usuarios/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'PORT_OPERATOR' })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/usuarios/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
