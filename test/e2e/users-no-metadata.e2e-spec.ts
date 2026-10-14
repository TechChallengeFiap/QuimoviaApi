import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

/**
 * Executa os endpoints como no `npm run start:dev` com tsx, que não emite a
 * metadata `design:*`: a injeção de dependências, o filtro de erros e a
 * validação passam a depender só do que está declarado explicitamente
 * (@Inject e o DTO esperado pelo ValidationPipe).
 *
 * Assim como no main.ts, apenas o ValidationPipe é global; os erros de domínio
 * são tratados pelo filtro declarado no controller.
 */
describe('UsersController sem a metadata de decorators (e2e)', () => {
  let app: INestApplication;

  const payload = {
    name: 'Maria Silva',
    email: 'maria@quimovia.com',
    password: 'S3nhaForte!',
    role: 'PORT_OPERATOR',
  };

  beforeAll(async () => {
    disableDesignMetadata();
    // Os casos de uso registram os erros esperados (404, 409) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const { UserModule } = await import('@/modules/user/user.module.js');
    const { USER_REPOSITORY } =
      await import('@/modules/user/domain/repositories/user.repository.js');
    const { PASSWORD_HASHER } =
      await import('@/modules/user/application/contracts/password-hasher.contract.js');
    const { SESSION_REPOSITORY } =
      await import('@/modules/user/domain/repositories/session.repository.js');
    const { AUTH_CONFIG } =
      await import('@/modules/user/infrastructure/config/auth.config.js');
    const { TEST_AUTH_CONFIG } = await import('../mocks/auth-config.mock.js');
    const { UserRepositoryMock } =
      await import('../mocks/user-repository.mock.js');
    const { PasswordHasherMock } =
      await import('../mocks/password-hasher.mock.js');
    const { SessionRepositoryMock } =
      await import('../mocks/session-repository.mock.js');

    const { PrismaService } =
      await import('@/shared/infrastructure/persistence/prisma/prisma.service.js');
    const { createPrismaServiceStub } =
      await import('../mocks/prisma-service.mock.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaServiceStub())
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
    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('cadastra, busca, atualiza e remove um usuário', async () => {
    const created = await request(app.getHttpServer())
      .post('/usuarios')
      .send(payload)
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer()).get(`/usuarios/${id}`).expect(200);
    await request(app.getHttpServer())
      .patch(`/usuarios/${id}`)
      .send({ status: 'BLOCKED' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('BLOCKED');
      });
    await request(app.getHttpServer()).delete(`/usuarios/${id}`).expect(204);
  });

  it('traduz os erros de domínio para 404 e 409', async () => {
    const duplicated = { ...payload, email: 'duplicado@quimovia.com' };

    await request(app.getHttpServer())
      .get('/usuarios/id-inexistente')
      .expect(404);
    await request(app.getHttpServer())
      .post('/usuarios')
      .send(duplicated)
      .expect(201);
    await request(app.getHttpServer())
      .post('/usuarios')
      .send(duplicated)
      .expect(409);
  });

  it('valida o corpo do cadastro e da atualização com o DTO esperado', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({ ...payload, password: '123' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({ ...payload, email: 'extra@quimovia.com', admin: true })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/usuarios')
      .send({ ...payload, email: 'status@quimovia.com' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/usuarios/${created.body.id}`)
      .send({ status: 'XPTO' })
      .expect(400);
  });

  it('valida e converte os parâmetros da listagem', async () => {
    await request(app.getHttpServer()).get('/usuarios?page=0').expect(400);

    const response = await request(app.getHttpServer())
      .get('/usuarios?role=PORT_OPERATOR&status=ACTIVE&page=1&pageSize=20')
      .expect(200);

    expect(response.body).toMatchObject({ page: 1, pageSize: 20 });
  });
});
