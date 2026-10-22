import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

describe('Swagger do módulo audit-log (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    disableDesignMetadata();

    const { AuditLogModule } = await import('@/modules/audit-log/audit-log.module.js');
    const { UserModule } = await import('@/modules/user/user.module.js');
    const { AuthModule } = await import('@/modules/user/auth.module.js');
    const { USER_REPOSITORY } = await import('@/modules/user/domain/repositories/user.repository.js');
    const { SESSION_REPOSITORY } = await import('@/modules/user/domain/repositories/session.repository.js');
    const { PASSWORD_HASHER } = await import('@/modules/user/application/contracts/password-hasher.contract.js');
    const { AUTH_CONFIG } = await import('@/modules/user/infrastructure/auth/auth.config.js');
    const { AUDIT_LOG_REPOSITORY } = await import('@/modules/audit-log/domain/repositories/audit-log.repository.js');

    const { UserRepositoryMock } = await import('../mocks/user-repository.mock.js');
    const { SessionRepositoryMock } = await import('../mocks/session-repository.mock.js');
    const { PasswordHasherMock } = await import('../mocks/password-hasher.mock.js');
    const { TEST_AUTH_CONFIG } = await import('../mocks/auth-config.mock.js');
    const { AuditLogRepositoryMock } = await import('../mocks/audit-log-repository.mock.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [UserModule, AuthModule, AuditLogModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(SESSION_REPOSITORY)
      .useClass(SessionRepositoryMock)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .overrideProvider(AUDIT_LOG_REPOSITORY)
      .useClass(AuditLogRepositoryMock)
      .compile();

    app = moduleFixture.createNestApplication();
    document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('gera o documento OpenAPI do módulo sem erros com disableDesignMetadata', () => {
    expect(document).toBeDefined();
    expect(document.paths['/logs/users']).toBeDefined();
    expect(document.paths['/logs/chemical-products']).toBeDefined();
    expect(document.paths['/logs/chemical-shipments']).toBeDefined();
    expect(document.paths['/logs/inspections']).toBeDefined();
    expect(document.paths['/logs/shipment-documents']).toBeDefined();
  });

  it('documenta as schemas AuditLogResponseDto e AuditLogPageResponseDto', () => {
    expect(document.components?.schemas?.AuditLogResponseDto).toBeDefined();
    expect(document.components?.schemas?.AuditLogPageResponseDto).toBeDefined();
    expect(document.components?.schemas?.AuditLogResponseDto).toMatchObject({
      properties: {
        id: { type: 'string' },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
        actorId: { type: 'string' },
        actorName: { type: 'string' },
        action: { type: 'string' },
        description: { type: 'string' },
        createdAt: { type: 'string' },
      },
    });
  });
});
