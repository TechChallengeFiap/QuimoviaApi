import { jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

describe.each([false, true])(
  'Aplicação com design metadata: %s',
  (withMetadata) => {
    let app: INestApplication;
    let document: OpenAPIObject;
    let productId: string;
    let responsibleUserId: string;

    beforeAll(async () => {
      if (!withMetadata) disableDesignMetadata();
      const { AppModule } = await import('@/app.module.js');
      const { PrismaService } =
        await import('@/shared/infrastructure/persistence/prisma/prisma.service.js');
      const { AUTH_CONFIG } =
        await import('@/modules/user/infrastructure/auth/auth.config.js');
      const { TEST_AUTH_CONFIG } = await import('../mocks/auth-config.mock.js');
      const { USER_REPOSITORY } =
        await import('@/modules/user/domain/repositories/user.repository.js');
      const { UserRepositoryMock } =
        await import('../mocks/user-repository.mock.js');
      const { SESSION_REPOSITORY } =
        await import('@/modules/user/domain/repositories/session.repository.js');
      const { SessionRepositoryMock } =
        await import('../mocks/session-repository.mock.js');
      const { PASSWORD_HASHER } =
        await import('@/modules/user/application/contracts/password-hasher.contract.js');
      const { PasswordHasherMock } =
        await import('../mocks/password-hasher.mock.js');
      const { loginAsAdmin } = await import('../mocks/admin-session.mock.js');
      const { CHEMICAL_PRODUCT_REPOSITORY } =
        await import('@/modules/chemical-products/domain/repositories/chemical-product.repository.js');
      const { ChemicalProductRepositoryMock } =
        await import('../mocks/chemical-product-repository.mock.js');
      const { CHEMICAL_SHIPMENT_REPOSITORY } =
        await import('@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js');
      const { ChemicalShipmentMock } =
        await import('../mocks/chemical-shipment.mock.js');
      const { INSPECTION_REPOSITORY } =
        await import('@/modules/inspection/domain/repositories/inspection.repository.js');
      const { InspectionRepositoryMock } =
        await import('../mocks/inspection-repository.mock.js');
      const { SHIPMENT_DOCUMENT_REPOSITORY } =
        await import('@/modules/document-compliance/domain/repositories/shipment-document.repository.js');
      const { ShipmentDocumentRepositoryMock } =
        await import('../mocks/shipment-document-repository.mock.js');
      const { DomainExceptionFilter } =
        await import('@/shared/presentation/filters/domain-exception.filter.js');
      const { buildSwaggerConfig } =
        await import('@/shared/infrastructure/config/swagger.config.js');

      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .overrideProvider(AUTH_CONFIG)
        .useValue(TEST_AUTH_CONFIG)
        .overrideProvider(USER_REPOSITORY)
        .useClass(UserRepositoryMock)
        .overrideProvider(SESSION_REPOSITORY)
        .useClass(SessionRepositoryMock)
        .overrideProvider(PASSWORD_HASHER)
        .useClass(PasswordHasherMock)
        .overrideProvider(CHEMICAL_PRODUCT_REPOSITORY)
        .useClass(ChemicalProductRepositoryMock)
        .overrideProvider(CHEMICAL_SHIPMENT_REPOSITORY)
        .useClass(ChemicalShipmentMock)
        .overrideProvider(INSPECTION_REPOSITORY)
        .useClass(InspectionRepositoryMock)
        .overrideProvider(SHIPMENT_DOCUMENT_REPOSITORY)
        .useClass(ShipmentDocumentRepositoryMock)
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
      const config = buildSwaggerConfig();
      SwaggerModule.setup('api', app, () =>
        SwaggerModule.createDocument(app, config),
      );
      await app.init();

      const adminToken = await loginAsAdmin(app, app.get(USER_REPOSITORY));
      const user = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Responsável Técnico',
          email: `tecnico-${randomUUID()}@quimovia.com`,
          password: 'S3nhaForte!',
          role: 'TECHNICAL_MANAGER',
        })
        .expect(201);
      responsibleUserId = user.body.id;
      const product = await request(app.getHttpServer())
        .post('/chemical-products')
        .send({
          code: 'H2SO4-98',
          technicalName: 'Ácido sulfúrico',
          unNumber: '1830',
          riskClass: 'CORROSIVE_SUBSTANCES',
          physicalState: 'LIQUID',
          status: 'ACTIVE',
          responsibleUserId,
        })
        .expect(201);
      productId = product.body.id;
    });

    afterAll(async () => {
      await app?.close();
      jest.restoreAllMocks();
    });

    it('serve a interface, os assets e o OpenAPI de todos os módulos sem dependência circular', async () => {
      await request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect(/swagger-ui/);
      await request(app.getHttpServer())
        .get('/api/swagger-ui-init.js')
        .expect(200)
        .expect(/SwaggerUIBundle/);
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      document = response.body;
      expect(Object.keys(document.paths)).toEqual(
        expect.arrayContaining([
          '/users',
          '/auth/login',
          '/chemical-products',
          '/chemical-shipment',
          '/inspections',
          '/shipment-documents',
        ]),
      );
      expect(
        document.components?.schemas?.UpdateChemicalShipmentDto,
      ).toMatchObject({
        properties: {
          status: { type: 'string', enum: Object.values(StatusShipment) },
        },
      });
    });

    async function createShipment() {
      const response = await request(app.getHttpServer())
        .post('/chemical-shipment')
        .send({
          productId,
          responsibleUserId,
          quantityProduct: 100,
          documentsIds: randomUUID(),
        })
        .expect(201);
      return `/chemical-shipment/${response.body.id}`;
    }

    it('executa cadastro, listagem, consulta, atualização e exclusão de cargas pelos endpoints documentados', async () => {
      const path = await createShipment();
      await request(app.getHttpServer())
        .get('/chemical-shipment')
        .query({ productId, page: 1, pageSize: 10 })
        .expect(200)
        .expect(({ body }) =>
          expect(body.items).toEqual(
            expect.arrayContaining([expect.objectContaining({ productId })]),
          ),
        );
      await request(app.getHttpServer()).get(path).expect(200);
      await request(app.getHttpServer())
        .patch(path)
        .send({ quantityProduct: 150 })
        .expect(200)
        .expect(({ body }) => expect(body.quantityProduct).toBe(150));
      await request(app.getHttpServer())
        .patch(path)
        .send({ status: StatusShipment.INSPECTION })
        .expect(200)
        .expect(({ body }) =>
          expect(body.status).toBe(StatusShipment.INSPECTION),
        );
      await request(app.getHttpServer()).delete(path).expect(200);
      await request(app.getHttpServer()).get(path).expect(404);
    });

    it.each([
      { status: 'INVALID' },
      { status: null },
      { quantityProduct: 0 },
      { quantityProduct: -1 },
      { quantityProduct: 'invalid' },
      { unexpected: true },
    ])(
      'rejeita atualização inválida sem persistir alterações: %j',
      async (payload) => {
        const path = await createShipment();
        await request(app.getHttpServer())
          .patch(path)
          .send(payload)
          .expect(400);
        await request(app.getHttpServer())
          .get(path)
          .expect(200)
          .expect(({ body }) =>
            expect(body).toMatchObject({
              quantityProduct: 100,
              status: StatusShipment.ANALYZING,
            }),
          );
      },
    );
  },
);
