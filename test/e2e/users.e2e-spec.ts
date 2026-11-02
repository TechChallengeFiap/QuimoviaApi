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
      .post('/users')
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
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(201);
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(409);
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/users')
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
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.find@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    await request(app.getHttpServer())
      .get(`/users/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('maria.find@quimovia.com');
      });

    await request(app.getHttpServer()).get('/users/id-inexistente').expect(404);
  });

  it('lista usuários paginados', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.list@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(response.body).toMatchObject({ page: 1, pageSize: 20 });
    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('atualiza um usuário, incluindo bloquear e desbloquear', async () => {
    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.update@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Maria Souza', status: 'BLOCKED' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Maria Souza');
        expect(body.status).toBe('BLOCKED');
      });

    await request(app.getHttpServer())
      .patch(`/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ACTIVE');
      });
  });

  it('remove um usuário e passa a retornar 404 nas buscas seguintes', async () => {
    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Maria Silva',
        email: 'maria.delete@quimovia.com',
        password: 'S3nhaForte!',
        role: 'PORT_OPERATOR',
      });

    const id = created.body.id as string;

    await request(app.getHttpServer())
      .delete(`/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer()).get(`/users/${id}`).expect(404);
  });

  it('retorna 404 ao remover um usuário inexistente', async () => {
    await request(app.getHttpServer())
      .delete('/users/id-inexistente')
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
        .post('/users')
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

    it('exige o token de acesso para cadastrar, editar, trocar o perfil e remover', async () => {
      const id = await createUser('maria.auth@quimovia.com');

      await request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(401);
      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .send({ status: 'INACTIVE' })
        .expect(401);
      await request(app.getHttpServer())
        .patch(`/users/${id}/role`)
        .send({ role: 'SYSTEM_ADMIN' })
        .expect(401);
      await request(app.getHttpServer()).delete(`/users/${id}`).expect(401);
    });

    it('responde 403 para os outros perfis, sem alterar nada', async () => {
      const id = await createUser(
        'maria.gestora@quimovia.com',
        'OPERATIONS_MANAGER',
      );
      const otherId = await createUser('joao.operador@quimovia.com');
      const token = await loginAs('maria.gestora@quimovia.com');

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/users/${id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SYSTEM_ADMIN' })
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/users/${otherId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Outro Nome' })
        .expect(403)
        .expect(({ body }) => {
          expect(body.message).toBe(
            'Apenas o Administrador do Sistema pode alterar os dados de outro usuário.',
          );
        });
      await request(app.getHttpServer())
        .delete(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        message:
          'O perfil do usuário não tem permissão para executar esta operação.',
        error: 'Forbidden',
        statusCode: 403,
      });
      await request(app.getHttpServer())
        .get(`/users/${id}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.role).toBe('OPERATIONS_MANAGER');
        });
      await request(app.getHttpServer())
        .get(`/users/${otherId}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newUser.name);
        });
      await request(app.getHttpServer())
        .get('/users')
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
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/users/${id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SYSTEM_ADMIN' })
        .expect(200);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/users/${id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'PORT_OPERATOR' })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('edição dos próprios dados', () => {
    const password = 'S3nhaForte!';

    async function createAndLogin(email: string): Promise<{
      id: string;
      token: string;
    }> {
      const created = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Maria Silva', email, password, role: 'PORT_OPERATOR' })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      return {
        id: created.body.id as string,
        token: login.body.accessToken as string,
      };
    }

    it('permite trocar nome, e-mail e senha, e o login passa a usar os novos dados', async () => {
      const { id, token } = await createAndLogin('maria.self@quimovia.com');

      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Maria Souza',
          email: 'maria.souza@quimovia.com',
          password: 'N0vaS3nhaForte!',
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toMatchObject({
            name: 'Maria Souza',
            email: 'maria.souza@quimovia.com',
            role: 'PORT_OPERATOR',
          });
        });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'maria.souza@quimovia.com',
          password: 'N0vaS3nhaForte!',
        })
        .expect(200);
    });

    it('recusa o perfil no corpo da edição, que tem rota própria', async () => {
      const { id, token } = await createAndLogin('maria.role@quimovia.com');

      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SYSTEM_ADMIN' })
        .expect(400);
      await request(app.getHttpServer())
        .get(`/users/${id}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.role).toBe('PORT_OPERATOR');
        });
    });

    it('não permite bloquear a própria conta', async () => {
      const { id, token } = await createAndLogin('maria.block@quimovia.com');

      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'BLOCKED' })
        .expect(403)
        .expect(({ body }) => {
          expect(body.message).toBe(
            'Apenas o Administrador do Sistema pode bloquear um usuário.',
          );
        });
    });

    it('permite inativar a própria conta, o que encerra a sessão', async () => {
      const { id, token } = await createAndLogin('maria.inativa@quimovia.com');

      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INACTIVE' })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Maria Souza' })
        .expect(401);
    });
  });

  describe('exclusão lógica', () => {
    const payload = {
      name: 'Maria Silva',
      email: 'maria.excluida@quimovia.com',
      password: 'S3nhaForte!',
      role: 'PORT_OPERATOR',
    };

    async function createUser(): Promise<string> {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      return response.body.id as string;
    }

    it('tira o usuário das buscas, da listagem e do login, e encerra a sessão dele', async () => {
      const id = await createUser();
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: payload.email, password: payload.password })
        .expect(200);
      const token = login.body.accessToken as string;

      await request(app.getHttpServer())
        .delete(`/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer()).get(`/users/${id}`).expect(404);
      await request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(({ body }) => {
          expect(
            body.items.map((user: { id: string }) => user.id),
          ).not.toContain(id);
        });
      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Maria Souza' })
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: payload.email, password: payload.password })
        .expect(401);
      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Maria Souza' })
        .expect(401);
    });

    it('reativa o mesmo registro ao cadastrar de novo o e-mail excluído', async () => {
      const id = await createUser();
      await request(app.getHttpServer())
        .delete(`/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...payload,
          name: 'Maria Souza',
          password: 'N0vaS3nhaForte!',
          role: 'TECHNICAL_MANAGER',
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toMatchObject({
            id,
            name: 'Maria Souza',
            email: payload.email,
            role: 'TECHNICAL_MANAGER',
            status: 'ACTIVE',
          });
        });

      await request(app.getHttpServer()).get(`/users/${id}`).expect(200);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: payload.email, password: 'N0vaS3nhaForte!' })
        .expect(200);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(409);
    });

    it('não permite trocar o e-mail para o de um usuário excluído', async () => {
      const id = await createUser();
      await request(app.getHttpServer())
        .delete(`/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
      const other = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...payload, email: 'joao.ativo@quimovia.com' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/users/${other.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: payload.email })
        .expect(409);
    });
  });

  describe('cadastro público do embarcador', () => {
    const shipper = {
      name: 'Carlos Pereira',
      email: 'carlos.pereira@transportadora.com',
      password: 'S3nhaForte!',
    };

    it('cadastra o embarcador sem token, com o perfil SHIPPER_DRIVER e ativo', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/shippers')
        .send(shipper)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Carlos Pereira',
        email: 'carlos.pereira@transportadora.com',
        role: 'SHIPPER_DRIVER',
        status: 'ACTIVE',
      });
      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.password).toBeUndefined();
    });

    it('permite ao embarcador cadastrado fazer login', async () => {
      await request(app.getHttpServer())
        .post('/users/shippers')
        .send(shipper)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: shipper.email, password: shipper.password })
        .expect(200)
        .expect(({ body }) => {
          expect(body.user.role).toBe('SHIPPER_DRIVER');
        });
    });

    it.each([
      ['o perfil', { role: 'SYSTEM_ADMIN' }],
      ['o status', { status: 'INACTIVE' }],
    ])('rejeita o cadastro que informa %s', async (_campo, extra) => {
      await request(app.getHttpServer())
        .post('/users/shippers')
        .send({ ...shipper, ...extra })
        .expect(400);
    });

    it('rejeita e-mail já cadastrado, inclusive por um usuário interno', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...shipper, role: 'PORT_OPERATOR' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/users/shippers')
        .send(shipper)
        .expect(409);
    });

    it('não reativa pelo cadastro público a conta de um usuário excluído', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...shipper, role: 'PORT_OPERATOR' })
        .expect(201);
      await request(app.getHttpServer())
        .delete(`/users/${created.body.id as string}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/users/shippers')
        .send({ ...shipper, password: 'OutraS3nha!' })
        .expect(409);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: shipper.email, password: 'OutraS3nha!' })
        .expect(401);
      await request(app.getHttpServer())
        .get(`/users/${created.body.id as string}`)
        .expect(404);
    });

    it('rejeita payload inválido', async () => {
      await request(app.getHttpServer())
        .post('/users/shippers')
        .send({ name: 'Ok', email: 'invalido', password: '123' })
        .expect(400);
    });

    it('não dá ao embarcador acesso às rotas de gestão de usuários', async () => {
      await request(app.getHttpServer())
        .post('/users/shippers')
        .send(shipper)
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: shipper.email, password: shipper.password })
        .expect(200);

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${login.body.accessToken as string}`)
        .send({
          name: 'Maria Silva',
          email: 'maria.shipper@quimovia.com',
          password: 'S3nhaForte!',
          role: 'SYSTEM_ADMIN',
        })
        .expect(403);
    });
  });
});
