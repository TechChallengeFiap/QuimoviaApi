import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/config/auth.config.js';
import { buildSwaggerConfig } from '@/shared/presentation/docs/swagger.config.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import { createPrismaServiceStub } from '../mocks/prisma-service.mock.js';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaServiceStub())
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('exige o token de acesso no Swagger só nas rotas protegidas pelo AuthGuard', () => {
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    const protectedOperations = Object.entries(document.paths).flatMap(
      ([path, operations]) =>
        Object.entries(operations)
          .filter(
            ([, operation]) =>
              typeof operation === 'object' &&
              operation !== null &&
              'security' in operation &&
              Array.isArray(operation.security) &&
              operation.security.length > 0,
          )
          .map(([method]) => `${method.toUpperCase()} ${path}`),
    );

    expect(document.security).toBeUndefined();
    expect(protectedOperations).toEqual(['POST /auth/logout']);
  });

  afterEach(async () => {
    await app.close();
  });
});
