import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module.ts';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
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

  afterEach(async () => {
    await app.close();
  });
});
