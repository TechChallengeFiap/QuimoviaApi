import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '@/app.module.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { ChemicalProductRepositoryMock } from '../mocks/chemical-product-repository.mock.js';
import {
  CHEMICAL_SHIPMENT_REPOSITORY,
  ChemicalShipmentRepository,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { ChemicalShipmentMock } from '../mocks/chemical-shipment.mock.js';
import {
  SHIPMENT_DOCUMENT_REPOSITORY,
  ShipmentDocumentRepository,
} from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { ShipmentDocumentRepositoryMock } from '../mocks/shipment-document-repository.mock.js';
import { AUDIT_LOG_REPOSITORY } from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import { AuditLogRepositoryMock } from '../mocks/audit-log-repository.mock.js';
import { PASSWORD_HASHER } from '@/modules/user/application/contracts/password-hasher.contract.js';
import { PasswordHasherMock } from '../mocks/password-hasher.mock.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { SessionRepositoryMock } from '../mocks/session-repository.mock.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import {
  createAttachmentData,
  createShipmentDocumentData,
} from '../mocks/shipment-document.fixture.js';

describe('ChemicalShipmentController (e2e)', () => {
  let app: INestApplication;
  let users: UserRepository;
  let products: ChemicalProductRepository;
  let shipments: ChemicalShipmentRepository;
  let documents: ShipmentDocumentRepository;
  let auditLogs: AuditLogRepositoryMock;

  let responsibleUser: User;
  let activeProduct: ChemicalProduct;
  let inactiveProduct: ChemicalProduct;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: async () => {},
        $disconnect: async () => {},
      })
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(PasswordHasherMock)
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(SESSION_REPOSITORY)
      .useClass(SessionRepositoryMock)
      .overrideProvider(CHEMICAL_PRODUCT_REPOSITORY)
      .useClass(ChemicalProductRepositoryMock)
      .overrideProvider(CHEMICAL_SHIPMENT_REPOSITORY)
      .useClass(ChemicalShipmentMock)
      .overrideProvider(SHIPMENT_DOCUMENT_REPOSITORY)
      .useClass(ShipmentDocumentRepositoryMock)
      .overrideProvider(AUDIT_LOG_REPOSITORY)
      .useClass(AuditLogRepositoryMock)
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

    users = app.get(USER_REPOSITORY);
    products = app.get(CHEMICAL_PRODUCT_REPOSITORY);
    shipments = app.get(CHEMICAL_SHIPMENT_REPOSITORY);
    documents = app.get(SHIPMENT_DOCUMENT_REPOSITORY);
    auditLogs = app.get(AUDIT_LOG_REPOSITORY);

    responsibleUser = await users.create(
      User.create({
        name: 'Responsável Técnico da Carga',
        email: 'tecnico.carga@quimovia.com',
        passwordHash: 'hash-seguro',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );

    activeProduct = await products.create(
      ChemicalProduct.create({
        code: 'H2SO4-98',
        technicalName: 'Ácido Sulfúrico 98%',
        tradeName: 'Sulfurax',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        status: ProductStatus.ACTIVE,
        responsibleUserId: responsibleUser.id,
      }),
    );

    inactiveProduct = await products.create(
      ChemicalProduct.create({
        code: 'CL2-GAS',
        technicalName: 'Cloro Gasoso Liquefeito',
        tradeName: 'Clorox',
        unNumber: '1017',
        riskClass: ProductRiskClass.TOXIC_SUBSTANCES,
        physicalState: ProductPhysicalState.GASEOUS,
        status: ProductStatus.INACTIVE,
        responsibleUserId: responsibleUser.id,
      }),
    );
  });

  afterEach(async () => {
    await app?.close();
  });

  async function createValidShipment(override: Record<string, unknown> = {}) {
    const payload = {
      productId: activeProduct.id,
      responsibleUserId: responsibleUser.id,
      quantityProduct: 250.5,
      documentsIds: `DOC-${randomUUID()}`,
      ...override,
    };

    const response = await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send(payload)
      .expect(201);

    return response.body as {
      id: string;
      code: string;
      productId: string;
      responsibleUserId: string;
      quantityProduct: number;
      unit: string;
      origin: string;
      destination: string;
      entryDate: string;
      documentsIds: string;
      status: StatusShipment;
      createdAt: string;
      updatedAt: string;
    };
  }

  describe('POST /chemical-shipment — Cadastro de Cargas e Regras do Edital', () => {
    it('cadastra uma nova carga química com produto e usuário válidos, nascendo em REGISTERED', async () => {
      const shipment = await createValidShipment();

      expect(shipment).toMatchObject({
        productId: activeProduct.id,
        responsibleUserId: responsibleUser.id,
        quantityProduct: 250.5,
        status: StatusShipment.REGISTERED,
      });
      expect(shipment.id).toBeDefined();
    });

    it('bloqueia registro de carga com produto químico inativo (422)', async () => {
      const response = await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: inactiveProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: 100,
          documentsIds: 'doc-001',
        })
        .expect(422);

      expect(response.body.message).toContain('inativo');
    });

    it('bloqueia registro de carga com quantidade menor ou igual a zero (400)', async () => {
      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: 0,
          documentsIds: 'doc-001',
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: -15,
          documentsIds: 'doc-001',
        })
        .expect(400);
    });

    it('bloqueia registro de carga sem produto químico associado (400)', async () => {
      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          responsibleUserId: responsibleUser.id,
          quantityProduct: 100,
          documentsIds: 'doc-001',
        })
        .expect(400);
    });

    it('bloqueia registro de carga com produto inexistente (404)', async () => {
      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: randomUUID(),
          responsibleUserId: responsibleUser.id,
          quantityProduct: 100,
          documentsIds: 'doc-001',
        })
        .expect(404);
    });

    it('bloqueia registro de carga com responsável técnico inexistente (404)', async () => {
      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: randomUUID(),
          quantityProduct: 100,
          documentsIds: 'doc-001',
        })
        .expect(404);
    });

    it('cadastra uma nova carga química informando todos os campos adicionais do edital (code, unit, origin, destination, entryDate)', async () => {
      const entryDate = '2026-10-24T12:00:00.000Z';
      const payload = {
        productId: activeProduct.id,
        responsibleUserId: responsibleUser.id,
        quantityProduct: 1200,
        documentsIds: `DOC-${randomUUID()}`,
        code: 'CARGO-E2E-2026',
        unit: 'toneladas',
        origin: 'Porto de Santos - Terminal Químico',
        destination: 'Terminal Industrial Mauá',
        entryDate,
      };

      const response = await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        code: 'CARGO-E2E-2026',
        productId: activeProduct.id,
        responsibleUserId: responsibleUser.id,
        quantityProduct: 1200,
        unit: 'toneladas',
        origin: 'Porto de Santos - Terminal Químico',
        destination: 'Terminal Industrial Mauá',
        status: StatusShipment.REGISTERED,
      });
      expect(new Date(response.body.entryDate).toISOString()).toBe(entryDate);
    });

    it('rejeita cadastro com código já existente (409 Conflict)', async () => {
      const code = `CARGO-DUP-${randomUUID().slice(0, 8)}`;
      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: 100,
          documentsIds: 'doc-001',
          code,
        })
        .expect(201);

      const dupResponse = await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: 200,
          documentsIds: 'doc-002',
          code,
        })
        .expect(409);

      expect(dupResponse.body.message).toContain('Já existe uma carga química');
    });

    it('rejeita cadastro com campos textuais que excedem o tamanho máximo permitido (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: 100,
          documentsIds: 'doc-001',
          unit: 'u'.repeat(25),
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId: activeProduct.id,
          responsibleUserId: responsibleUser.id,
          quantityProduct: 100,
          documentsIds: 'doc-001',
          code: 'c'.repeat(65),
        })
        .expect(400);
    });
  });

  describe('GET /chemical-shipment — Consulta e Listagem', () => {
    it('retorna os detalhes de uma carga pelo ID', async () => {
      const created = await createValidShipment();

      const response = await request(app.getHttpServer())
        .get(`/chemical-shipment/${created.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.id,
        productId: activeProduct.id,
        status: StatusShipment.REGISTERED,
      });
    });

    it('retorna 404 para carga inexistente', async () => {
      await request(app.getHttpServer())
        .get(`/chemical-shipment/${randomUUID()}`)
        .expect(404);
    });

    it('lista cargas cadastradas com paginação e filtros', async () => {
      const created = await createValidShipment();

      const response = await request(app.getHttpServer())
        .get('/chemical-shipment')
        .query({
          productId: activeProduct.id,
          status: StatusShipment.REGISTERED,
          page: 1,
          pageSize: 10,
        })
        .expect(200);

      expect(response.body.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: created.id })]),
      );
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /chemical-shipment/:id/transitions — Consulta Dinâmica de Transições (Diferencial)', () => {
    it('informa transições permitidas para carga recém-registrada', async () => {
      const created = await createValidShipment();

      const response = await request(app.getHttpServer())
        .get(`/chemical-shipment/${created.id}/transitions`)
        .expect(200);

      expect(response.body).toEqual({
        shipmentId: created.id,
        currentStatus: StatusShipment.REGISTERED,
        currentStatusLabel: 'Registrada',
        isTerminal: false,
        allowedTransitions: [
          { status: StatusShipment.ANALYZING, label: 'Em análise' },
          { status: StatusShipment.CANCELLED, label: 'Cancelada' },
        ],
      });
    });

    it('informa isTerminal: true e lista vazia para carga em estado terminal', async () => {
      const created = await createValidShipment();
      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/cancel`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/chemical-shipment/${created.id}/transitions`)
        .expect(200);

      expect(response.body).toEqual({
        shipmentId: created.id,
        currentStatus: StatusShipment.CANCELLED,
        currentStatusLabel: 'Cancelada',
        isTerminal: true,
        allowedTransitions: [],
      });
    });
  });

  describe('PATCH /chemical-shipment/:id — Edição Cadastral e Proteção de Backdoor', () => {
    it('permite alterar a quantidade da carga enquanto estiver em REGISTERED ou ANALYZING', async () => {
      const created = await createValidShipment({ quantityProduct: 100 });

      // 1. Atualização em REGISTERED
      const res1 = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}`)
        .send({ quantityProduct: 180 })
        .expect(200);
      expect(res1.body.quantityProduct).toBe(180);

      // Avança para ANALYZING
      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/status`)
        .send({ status: StatusShipment.ANALYZING })
        .expect(200);

      // 2. Atualização em ANALYZING
      const res2 = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}`)
        .send({ quantityProduct: 220 })
        .expect(200);
      expect(res2.body.quantityProduct).toBe(220);
    });

    it('impede alteração de dados cadastrais quando a carga está em inspeção ou posterior (422)', async () => {
      const created = await createValidShipment();

      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/status`)
        .send({ status: StatusShipment.ANALYZING })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/status`)
        .send({ status: StatusShipment.INSPECTION })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}`)
        .send({ quantityProduct: 300 })
        .expect(422);

      expect(response.body.message).toContain('só podem ser alterados enquanto ela está');
    });

    it('rejeita o campo status no PATCH genérico garantindo que a máquina de estados não é burlada (400)', async () => {
      const created = await createValidShipment();

      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}`)
        .send({ status: StatusShipment.APPROVED })
        .expect(400);

      const unchanged = await shipments.findById(created.id);
      expect(unchanged?.status).toBe(StatusShipment.REGISTERED);
    });
  });

  describe('Ciclo de Vida da Carga e Transições de Status', () => {
    it('libera a carga com documentação e responsável cadastrados pela API', async () => {
      const shipment = await createValidShipment();
      const document = await request(app.getHttpServer())
        .post('/shipment-documents')
        .send({
          shipmentId: shipment.id,
          shipperId: responsibleUser.id,
          responsibleUserId: responsibleUser.id,
          compositionVersion: 1,
          attachments: [createAttachmentData({ expiresAt: null })],
        })
        .expect(201);
      expect(document.body.responsibleUser).toEqual({
        id: responsibleUser.id,
        name: responsibleUser.name,
      });

      for (const status of [StatusShipment.ANALYZING, StatusShipment.INSPECTION]) {
        await request(app.getHttpServer())
          .patch(`/chemical-shipment/${shipment.id}/status`)
          .send({ status })
          .expect(200);
      }
      const released = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${shipment.id}/release`)
        .send({})
        .expect(200);
      expect(released.body.status).toBe(StatusShipment.APPROVED);
    });

    it('executa o fluxo completo do edital: Registrada → Em análise → Em inspeção → Liberada → Em movimentação → Finalizada', async () => {
      const created = await createValidShipment();
      const patch = (endpoint: string, body?: object) =>
        request(app.getHttpServer())
          .patch(`/chemical-shipment/${created.id}/${endpoint}`)
          .send(body ?? {});

      // 1. Registrada -> Em análise
      await patch('status', { status: StatusShipment.ANALYZING }).expect(200);

      // 2. Em análise -> Em inspeção
      await patch('status', { status: StatusShipment.INSPECTION }).expect(200);

      // 3. Tentativa de liberar sem documentação obrigatória -> 422
      const failedRelease = await patch('release').expect(422);
      expect(failedRelease.body.message).toContain('sem documentação obrigatória');

      // 4. Cadastra documentação técnica ativa e vigente para a carga
      await documents.create(
        ShipmentDocument.create(
          createShipmentDocumentData({
            shipmentId: created.id,
            attachments: [createAttachmentData({ expiresAt: null })],
          }),
        ),
      );

      // 5. Agora a liberação tem sucesso -> Liberada (APPROVED)
      const released = await patch('release').expect(200);
      expect(released.body.status).toBe(StatusShipment.APPROVED);

      // 6. Liberada -> Em movimentação
      const transit = await patch('status', { status: StatusShipment.IN_TRANSIT }).expect(200);
      expect(transit.body.status).toBe(StatusShipment.IN_TRANSIT);

      // 7. Em movimentação -> Finalizada
      const completed = await patch('status', { status: StatusShipment.COMPLETED }).expect(200);
      expect(completed.body.status).toBe(StatusShipment.COMPLETED);

      // 8. Estado terminal: não pode ser cancelada nem sofrer alterações
      await patch('cancel').expect(422);
      await patch('status', { status: StatusShipment.IN_TRANSIT }).expect(422);
    });

    it('bloqueia carga em inspeção e impede movimentação de carga bloqueada (422)', async () => {
      const created = await createValidShipment();
      const patch = (endpoint: string, body?: object) =>
        request(app.getHttpServer())
          .patch(`/chemical-shipment/${created.id}/${endpoint}`)
          .send(body ?? {});

      await patch('status', { status: StatusShipment.ANALYZING }).expect(200);
      await patch('status', { status: StatusShipment.INSPECTION }).expect(200);

      // Bloqueia a carga a partir de inspeção
      const blocked = await patch('block').expect(200);
      expect(blocked.body.status).toBe(StatusShipment.REPROVED);

      // Tentativa ilegal de movimentar carga bloqueada -> 422
      const rejectedTransit = await patch('status', { status: StatusShipment.IN_TRANSIT }).expect(422);
      expect(rejectedTransit.body.message).toContain('bloqueada não pode entrar em movimentação');
    });

    it('permite cancelamento e impede reativação ou liberação de carga cancelada (422)', async () => {
      const created = await createValidShipment();

      const cancelled = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/cancel`)
        .expect(200);
      expect(cancelled.body.status).toBe(StatusShipment.CANCELLED);

      // Tentativa proibida de liberar carga cancelada
      const rejectedRelease = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/release`)
        .expect(422);
      expect(rejectedRelease.body.message).toContain('cancelada não pode ser liberada');
    });

    it('rejeita transição para status inválido sintaticamente (400)', async () => {
      const created = await createValidShipment();

      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/status`)
        .send({ status: 'STATUS_TOTALMENTE_INVALIDO' })
        .expect(400);
    });

    it('registra o operador autenticado nos logs de auditoria quando diferente do responsável técnico', async () => {
      const operatorPassword = 'SenhaOperador123!';
      const operator = await users.create(
        User.create({
          name: 'Operador Portuário Santos',
          email: 'operador.santos@quimovia.com',
          passwordHash: `hash:${operatorPassword}`,
          role: UserRole.PORT_OPERATOR,
        }),
      );

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'operador.santos@quimovia.com',
          password: operatorPassword,
        })
        .expect(200);

      const operatorToken = loginRes.body.accessToken;
      expect(operatorToken).toBeDefined();

      const created = await createValidShipment();

      await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: StatusShipment.ANALYZING })
        .expect(200);

      const recorded = auditLogs.entries.find(
        (entry) =>
          entry.entityId === created.id &&
          entry.action === 'STATUS_CHANGED',
      );

      expect(recorded).toBeDefined();
      expect(recorded?.actorId).toBe(operator.id);
      expect(recorded?.actorId).not.toBe(responsibleUser.id);
      expect(recorded?.actorName).toBe('Operador Portuário Santos');
      expect(recorded?.description).toContain('Operador Portuário Santos');
    });
  });

  describe('PATCH /chemical-shipment/:id — Atualização Cadastral', () => {
    it('permite atualizar os campos adicionais (code, unit, origin, destination, entryDate) nos status permitidos', async () => {
      const created = await createValidShipment();
      const newEntryDate = '2026-10-25T15:00:00.000Z';

      const updateRes = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}`)
        .send({
          code: 'CARGO-E2E-UPDATED',
          unit: 'litros',
          origin: 'Porto de Paranaguá',
          destination: 'Terminal Químico de Santos',
          entryDate: newEntryDate,
          quantityProduct: 300,
        })
        .expect(200);

      expect(updateRes.body).toMatchObject({
        id: created.id,
        code: 'CARGO-E2E-UPDATED',
        unit: 'litros',
        origin: 'Porto de Paranaguá',
        destination: 'Terminal Químico de Santos',
        quantityProduct: 300,
      });
      expect(new Date(updateRes.body.entryDate).toISOString()).toBe(newEntryDate);
    });

    it('rejeita atualização com campos textuais vazios (422 Unprocessable Entity)', async () => {
      const created = await createValidShipment();

      const response = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${created.id}`)
        .send({
          code: '   ',
        })
        .expect(422);

      expect(response.body.message).toContain('código da carga não pode ser vazio');
    });

    it('rejeita atualização com código já pertencente a outra carga (409 Conflict)', async () => {
      const shipment1 = await createValidShipment();
      const shipment2 = await createValidShipment();

      const response = await request(app.getHttpServer())
        .patch(`/chemical-shipment/${shipment2.id}`)
        .send({
          code: shipment1.code,
        })
        .expect(409);

      expect(response.body.message).toContain('Já existe uma carga química');
    });
  });

  describe('DELETE /chemical-shipment/:id — Exclusão Lógica', () => {
    it('realiza a remoção lógica da carga com sucesso', async () => {
      const created = await createValidShipment();

      await request(app.getHttpServer())
        .delete(`/chemical-shipment/${created.id}`)
        .expect(200);

      // Consulta subsequente retorna 404
      await request(app.getHttpServer())
        .get(`/chemical-shipment/${created.id}`)
        .expect(404);
    });
  });
});
