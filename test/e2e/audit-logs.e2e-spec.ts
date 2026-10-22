import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
import { AUDIT_LOG_REPOSITORY } from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module.js';
import { UserModule } from '@/modules/user/user.module.js';
import { AuthModule } from '@/modules/user/auth.module.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';
import { loginAsAdmin } from '../mocks/admin-session.mock.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import { PasswordHasherMock } from '../mocks/password-hasher.mock.js';
import { SessionRepositoryMock } from '../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';
import { AuditLogRepositoryMock } from '../mocks/audit-log-repository.mock.js';

describe('AuditLogsController (e2e)', () => {
  let app: INestApplication;
  let usersRepo: UserRepositoryMock;
  let auditLogsRepo: AuditLogRepositoryMock;
  let adminToken: string;
  let operatorToken: string;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    usersRepo = new UserRepositoryMock();
    auditLogsRepo = new AuditLogRepositoryMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule, AuthModule, AuditLogModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(usersRepo)
      .overrideProvider(AUDIT_LOG_REPOSITORY)
      .useValue(auditLogsRepo)
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

    adminToken = await loginAsAdmin(app, usersRepo);

    // Cria um operador para testar rejeição de perfil
    await usersRepo.create(
      User.create({
        name: 'Operador Silva',
        email: 'operador@quimovia.com',
        passwordHash: 'hash:S3nhaForte!',
        role: UserRole.OPERATOR,
      }),
    );

    const operatorLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'operador@quimovia.com', password: 'S3nhaForte!' })
      .expect(200);

    operatorToken = operatorLoginRes.body.accessToken;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('rejeita acesso de usuário não autenticado com 401', async () => {
    await request(app.getHttpServer()).get('/logs/users').expect(401);
    await request(app.getHttpServer()).get('/logs/chemical-products').expect(401);
    await request(app.getHttpServer()).get('/logs/chemical-shipments').expect(401);
    await request(app.getHttpServer()).get('/logs/inspections').expect(401);
    await request(app.getHttpServer()).get('/logs/shipment-documents').expect(401);
  });

  it('rejeita acesso de perfil sem privilégio de SYSTEM_ADMIN com 403', async () => {
    await request(app.getHttpServer())
      .get('/logs/users')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/logs/chemical-products')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);
  });

  it('permite consulta de logs de usuários por administrador', async () => {
    auditLogsRepo.entries.length = 0;

    await auditLogsRepo.create(
      AuditLogEntry.create({
        entityType: AuditedEntity.USER,
        entityId: 'user-123',
        actorId: 'admin-1',
        actorName: 'Admin',
        action: AuditAction.CREATED,
        description: 'Usuário "Admin" cadastrou o usuário "user-123"',
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/logs/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      entityType: 'USER',
      entityId: 'user-123',
      action: 'CREATED',
    });
    expect(response.body.total).toBe(1);
  });

  it('permite consulta de logs de produtos químicos por administrador', async () => {
    await auditLogsRepo.create(
      AuditLogEntry.create({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: 'prod-456',
        actorId: 'admin-1',
        actorName: 'Admin',
        action: AuditAction.STATUS_CHANGED,
        description: 'Usuário "Admin" alterou o status do produto químico "prod-456" para INACTIVE',
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/logs/chemical-products')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      entityType: 'CHEMICAL_PRODUCT',
      entityId: 'prod-456',
      action: 'STATUS_CHANGED',
    });
  });

  it('permite consulta de logs de cargas químicas por administrador', async () => {
    await auditLogsRepo.create(
      AuditLogEntry.create({
        entityType: AuditedEntity.CHEMICAL_SHIPMENT,
        entityId: 'shipment-789',
        actorId: 'admin-1',
        actorName: 'Admin',
        action: AuditAction.CREATED,
        description: 'Usuário "Admin" registrou a carga química "shipment-789"',
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/logs/chemical-shipments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].entityType).toBe('CHEMICAL_SHIPMENT');
  });

  it('permite consulta de logs de inspeções e documentos de carga', async () => {
    await auditLogsRepo.create(
      AuditLogEntry.create({
        entityType: AuditedEntity.INSPECTION,
        entityId: 'insp-111',
        actorId: 'admin-1',
        actorName: 'Admin',
        action: AuditAction.CREATED,
        description: 'Usuário "Admin" agendou inspeção "insp-111"',
      }),
    );

    await auditLogsRepo.create(
      AuditLogEntry.create({
        entityType: AuditedEntity.SHIPMENT_DOCUMENT,
        entityId: 'doc-222',
        actorId: 'admin-1',
        actorName: 'Admin',
        action: AuditAction.CREATED,
        description: 'Usuário "Admin" enviou documento "doc-222"',
      }),
    );

    const inspRes = await request(app.getHttpServer())
      .get('/logs/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const docRes = await request(app.getHttpServer())
      .get('/logs/shipment-documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(inspRes.body.items).toHaveLength(1);
    expect(inspRes.body.items[0].entityType).toBe('INSPECTION');

    expect(docRes.body.items).toHaveLength(1);
    expect(docRes.body.items[0].entityType).toBe('SHIPMENT_DOCUMENT');
  });
});
