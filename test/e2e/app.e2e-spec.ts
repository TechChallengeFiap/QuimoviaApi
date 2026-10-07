import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '@/app.module.ts';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
import { buildSwaggerConfig } from '@/shared/infrastructure/config/swagger.config.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.ts';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(async () => {}),
        $disconnect: jest.fn(async () => {}),
      })
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) continua público', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('exige o token de acesso nas rotas dos módulos', async () => {
    for (const path of ['/usuarios', '/inspecoes', '/chemical-shipment']) {
      await request(app.getHttpServer()).get(path).expect(401);
    }
  });

  it('documenta no Swagger como públicas só as rotas liberadas pelo guard', async () => {
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    const publicOperations = Object.entries(document.paths).flatMap(
      ([path, operations]) =>
        Object.entries(operations)
          .filter(
            ([, operation]) =>
              typeof operation === 'object' &&
              operation !== null &&
              'security' in operation &&
              Array.isArray(operation.security) &&
              operation.security.length === 0,
          )
          .map(([method]) => `${method.toUpperCase()} ${path}`),
    );

    expect(document.security).toEqual([{ bearer: [] }]);
    expect(publicOperations.sort()).toEqual([
      'GET /',
      'POST /autenticacao/login',
    ]);

    // As mesmas rotas respondem sem token; as demais exigem login.
    await request(app.getHttpServer()).get('/').expect(200);
    await request(app.getHttpServer())
      .post('/autenticacao/login')
      .send({})
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
