import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PASSWORD_HASHER } from '../../src/modules/identidade-acesso/application/contracts/password-hasher.contract.js';
import { USER_REPOSITORY } from '../../src/modules/identidade-acesso/domain/repositories/user.repository.js';
import { IdentidadeAcessoModule } from '../../src/modules/identidade-acesso/identidade-acesso.module.js';
import { DomainExceptionFilter } from '../../src/shared/presentation/filters/domain-exception.filter.js';
import { PasswordHasherMock } from '../mocks/password-hasher.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IdentidadeAcessoModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('cria um usuário e não expõe o hash da senha na resposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/usuarios')
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

    await request(app.getHttpServer()).post('/usuarios').send(data).expect(201);
    await request(app.getHttpServer()).post('/usuarios').send(data).expect(409);
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({ name: 'Ok', email: 'invalido', password: '123', role: 'INEXISTENTE' })
      .expect(400);
  });

  it('busca um usuário pelo id e retorna 404 para id inexistente', async () => {
    const created = await request(app.getHttpServer()).post('/usuarios').send({
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

    await request(app.getHttpServer()).get('/usuarios/id-inexistente').expect(404);
  });

  it('lista usuários paginados', async () => {
    await request(app.getHttpServer()).post('/usuarios').send({
      name: 'Maria Silva',
      email: 'maria.list@quimovia.com',
      password: 'S3nhaForte!',
      role: 'PORT_OPERATOR',
    });

    const response = await request(app.getHttpServer()).get('/usuarios').expect(200);

    expect(response.body).toMatchObject({ page: 1, pageSize: 20 });
    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
  });
});
