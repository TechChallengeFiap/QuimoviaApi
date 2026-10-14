import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

const PASSWORD = 'S3nhaForte!';

/**
 * Executa o login, o guard e o logout como no `npm run start:dev` com tsx, que
 * não emite a metadata `design:*`: a injeção de dependências (inclusive a do
 * guard aplicado em outro módulo e a do serviço de token), a validação do
 * corpo e a leitura da sessão passam a depender só do que está declarado
 * explicitamente.
 *
 * Assim como no main.ts, apenas o ValidationPipe é global; os erros de domínio
 * são tratados pelo filtro declarado no controller.
 */
describe('Autenticação sem a metadata de decorators (e2e)', () => {
  let app: INestApplication;
  let users: UserRepository;

  beforeAll(async () => {
    disableDesignMetadata();
    // Os casos de uso registram os erros esperados (401, 403) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const { USER_REPOSITORY } =
      await import('@/modules/user/domain/repositories/user.repository.js');
    const { SESSION_REPOSITORY } =
      await import('@/modules/user/domain/repositories/session.repository.js');
    const { PASSWORD_HASHER } =
      await import('@/modules/user/application/contracts/password-hasher.contract.js');
    const { AUTH_CONFIG } =
      await import('@/modules/user/infrastructure/config/auth.config.js');
    const { UserRepositoryMock } =
      await import('../mocks/user-repository.mock.js');
    const { SessionRepositoryMock } =
      await import('../mocks/session-repository.mock.js');
    const { PasswordHasherMock } =
      await import('../mocks/password-hasher.mock.js');
    const { TEST_AUTH_CONFIG } = await import('../mocks/auth-config.mock.js');
    const { ProtectedRouteModule } =
      await import('../mocks/protected-route.mock.js');

    const { PrismaService } =
      await import('@/shared/infrastructure/persistence/prisma/prisma.service.js');
    const { createPrismaServiceStub } =
      await import('../mocks/prisma-service.mock.js');

    const moduleFixture = await Test.createTestingModule({
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
    await app.init();

    users = app.get(USER_REPOSITORY);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  async function registerUser(email: string): Promise<User> {
    return users.create(
      User.create({
        name: 'Maria Silva',
        email,
        passwordHash: `hash:${PASSWORD}`,
        role: UserRole.SYSTEM_ADMIN,
      }),
    );
  }

  async function accessTokenOf(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);

    return response.body.accessToken as string;
  }

  it('faz login, acessa uma rota protegida e faz logout', async () => {
    await registerUser('maria@quimovia.com');
    const token = await accessTokenOf('maria@quimovia.com');

    await request(app.getHttpServer()).get('/rota-protegida').expect(401);
    await request(app.getHttpServer())
      .get('/rota-protegida')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ role: UserRole.SYSTEM_ADMIN });
      });
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    await request(app.getHttpServer())
      .get('/rota-protegida')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('traduz os erros de domínio do login para 401 e 403', async () => {
    const blocked = await registerUser('bloqueado@quimovia.com');
    blocked.block();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ninguem@quimovia.com', password: PASSWORD })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bloqueado@quimovia.com', password: PASSWORD })
      .expect(403);
  });

  it('valida o corpo do login com o DTO esperado', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nao-e-email', password: PASSWORD })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'maria@quimovia.com', password: PASSWORD, admin: true })
      .expect(400);
  });

  it('encerra as sessões de um usuário bloqueado pelo PATCH /usuarios/:id, sem reativá-las no desbloqueio', async () => {
    const joao = await registerUser('joao@quimovia.com');
    const joaoToken = await accessTokenOf('joao@quimovia.com');

    await request(app.getHttpServer())
      .patch(`/usuarios/${joao.id}`)
      .send({ status: 'BLOCKED' })
      .expect(200);
    // Desbloqueia antes de usar o token: ele só é recusado se o bloqueio já
    // tiver encerrado a sessão.
    await request(app.getHttpServer())
      .patch(`/usuarios/${joao.id}`)
      .send({ status: 'ACTIVE' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/rota-protegida')
      .set('Authorization', `Bearer ${joaoToken}`)
      .expect(401);
  });
});
