import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { ChemicalProductRepositoryMock } from '../mocks/chemical-product-repository.mock.js';
import { ShipmentDocumentRepositoryMock } from '../mocks/shipment-document-repository.mock.js';
import { UserModule } from '@/modules/user/user.module.js';
import { USER_DIRECTORY } from '@/modules/user/public/index.js';
import { UserDirectoryMock } from '../mocks/user-directory.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

const documentPayload = {
  type: 'SAFETY_DATA_SHEET',
  number: 'FISPQ-2026-01',
  filePath: 'documents/safety-sheet.pdf',
  expiresAt: '2028-01-01T00:00:00.000Z',
};

describe('Document CRUD without design metadata', () => {
  let app: INestApplication;
  let products: ChemicalProductRepositoryMock;
  let product: ChemicalProduct;
  let path: string;

  beforeAll(() => disableDesignMetadata());
  afterAll(() => jest.restoreAllMocks());

  beforeEach(async () => {
    const { DocumentComplianceModule } =
      await import('@/modules/document-compliance/document-compliance.module.js');
    const { ProductDocumentsController } =
      await import('@/modules/chemical-products/presentation/controllers/product-documents.controller.js');
    const { AddProductDocumentUseCase } =
      await import('@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js');
    const { RemoveProductDocumentUseCase } =
      await import('@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js');
    const { ListProductDocumentsUseCase } =
      await import('@/modules/chemical-products/application/use-cases/chemical-products/list-product-documents.use-case.js');
    const { FindProductDocumentByIdUseCase } =
      await import('@/modules/chemical-products/application/use-cases/chemical-products/find-product-document-by-id.use-case.js');
    const { UpdateProductDocumentUseCase } =
      await import('@/modules/chemical-products/application/use-cases/chemical-products/update-product-document.use-case.js');
    products = new ChemicalProductRepositoryMock();
    product = await products.create(
      ChemicalProduct.create({
        code: 'PRODUCT-01',
        technicalName: 'Ácido sulfúrico',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: 'existing-user-reference',
      }),
    );
    path = `/chemical-products/${product.id}/documents`;
    const moduleFixture = await Test.createTestingModule({
      imports: [DocumentComplianceModule],
      controllers: [ProductDocumentsController],
      providers: [
        AddProductDocumentUseCase,
        RemoveProductDocumentUseCase,
        ListProductDocumentsUseCase,
        FindProductDocumentByIdUseCase,
        UpdateProductDocumentUseCase,
        { provide: CHEMICAL_PRODUCT_REPOSITORY, useValue: products },
      ],
    })
      .overrideModule(UserModule)
      .useModule({
        module: class TestUserModule {},
        providers: [
          {
            provide: USER_DIRECTORY,
            useValue: new UserDirectoryMock(new UserRepositoryMock()),
          },
        ],
        exports: [USER_DIRECTORY],
      })
      .overrideProvider(SHIPMENT_DOCUMENT_REPOSITORY)
      .useValue(new ShipmentDocumentRepositoryMock())
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => app?.close());

  it('creates, lists, reads, updates and deletes a product document with the existing response contracts', async () => {
    const created = await request(app.getHttpServer())
      .post(path)
      .send(documentPayload)
      .expect(201);
    expect(created.body.id).toBe(product.id);
    const original = created.body.documents[0];
    const documentPath = `${path}/${original.id}`;
    const list = await request(app.getHttpServer()).get(path).expect(200);
    expect(list.body).toEqual([original]);
    await request(app.getHttpServer())
      .get(documentPath)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual(original));
    const updated = await request(app.getHttpServer())
      .patch(documentPath)
      .send({
        number: 'FISPQ-REVISED',
        filePath: 'documents/revised.pdf',
        expiresAt: null,
      })
      .expect(200);
    expect(updated.body).toEqual({
      ...original,
      number: 'FISPQ-REVISED',
      filePath: 'documents/revised.pdf',
      expiresAt: null,
    });
    const persisted = await products.findById(product.id);
    expect(persisted?.status).toBe(product.status);
    expect(persisted?.responsibleUserId).toBe(product.responsibleUserId);
    await request(app.getHttpServer())
      .delete(documentPath)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ id: product.id, documents: [] }),
      );
    await request(app.getHttpServer()).get(documentPath).expect(404);
    await request(app.getHttpServer())
      .get(path)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual([]));
    await request(app.getHttpServer()).delete(documentPath).expect(404);
  });

  it.each([
    [{ number: null }, 400],
    [{ number: '' }, 400],
    [{ number: ' ' }, 422],
    [{ number: 'x'.repeat(81) }, 400],
    [{ filePath: '' }, 400],
    [{ filePath: 123 }, 400],
    [{ filePath: 'x'.repeat(501) }, 400],
    [{ type: 'INVALID' }, 400],
    [{ expiresAt: 'invalid' }, 400],
    [{ expiresAt: '2026-02-30T00:00:00.000Z' }, 400],
    [{ expiresAt: '2025-02-29T00:00:00.000Z' }, 400],
    [{ expiresAt: '123' }, 400],
    [{ expiresAt: 123 }, 400],
    [{ status: 'ACTIVE' }, 400],
  ])(
    'rejects invalid product document creation: %j',
    async (changes, status) => {
      const response = await request(app.getHttpServer())
        .post(path)
        .send({ ...documentPayload, ...changes })
        .expect(status);
      expect(response.body.message).toBeDefined();
      expect(JSON.stringify(response.body.message)).not.toMatch(
        /should not exist|must be|should not be/,
      );
      expect((await products.findById(product.id))?.documents).toEqual([]);
    },
  );

  it('rejects missing required fields', async () => {
    await request(app.getHttpServer()).post(path).send({}).expect(400);
  });

  it.each([
    'id',
    'productId',
    'responsibleUserId',
    'shipperId',
    'status',
    'createdAt',
  ])('rejects protected fields on update: %s', async (field) => {
    const created = await request(app.getHttpServer())
      .post(path)
      .send(documentPayload)
      .expect(201);
    const original = created.body.documents[0];
    const documentPath = `${path}/${original.id}`;
    const response = await request(app.getHttpServer())
      .patch(documentPath)
      .send({ [field]: 'changed' })
      .expect(400);
    expect(response.body.message).toEqual([
      `O campo ${field} não é permitido.`,
    ]);
    await request(app.getHttpServer())
      .get(documentPath)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual(original));
  });

  it.each([
    { type: null },
    { number: null },
    { filePath: null },
    { expiresAt: 'invalid' },
    { expiresAt: '2026-02-30T00:00:00.000Z' },
    { expiresAt: '2025-02-29T00:00:00.000Z' },
    { expiresAt: '123' },
  ])(
    'rejects invalid updates without persisting changes: %j',
    async (changes) => {
      const created = await request(app.getHttpServer())
        .post(path)
        .send(documentPayload)
        .expect(201);
      const original = created.body.documents[0];
      const documentPath = `${path}/${original.id}`;
      await request(app.getHttpServer())
        .patch(documentPath)
        .send(changes)
        .expect(400);
      await request(app.getHttpServer())
        .get(documentPath)
        .expect(200)
        .expect(({ body }) => expect(body).toEqual(original));
    },
  );

  it('returns not found for missing products and documents across CRUD operations', async () => {
    const missingProductPath = '/chemical-products/missing-product/documents';
    for (const base of [missingProductPath, path]) {
      const missingDocumentPath = `${base}/${randomUUID()}`;
      await request(app.getHttpServer()).get(missingDocumentPath).expect(404);
      await request(app.getHttpServer())
        .patch(missingDocumentPath)
        .send({ number: 'REVISED' })
        .expect(404);
      await request(app.getHttpServer())
        .delete(missingDocumentPath)
        .expect(404);
    }
    await request(app.getHttpServer()).get(missingProductPath).expect(404);
    await request(app.getHttpServer())
      .post(missingProductPath)
      .send(documentPayload)
      .expect(404);
  });

  it('preserves shipment document CRUD and validation without design metadata or a global pipe', async () => {
    const payload = {
      shipmentId: randomUUID(),
      shipperId: randomUUID(),
      compositionVersion: 1,
    };
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(payload)
      .expect(201);
    const documentPath = created.headers.location;
    expect(documentPath).toBe(`/shipment-documents/${created.body.id}`);
    expect(created.body.shipmentId).toBe(payload.shipmentId);
    expect(created.body.cargoId).toBeUndefined();
    await request(app.getHttpServer()).get(documentPath).expect(200);
    await request(app.getHttpServer())
      .get('/shipment-documents')
      .query({ shipmentId: payload.shipmentId })
      .expect(200)
      .expect(({ body }) => expect(body.total).toBe(1));
    await request(app.getHttpServer())
      .patch(documentPath)
      .send({
        attachments: [
          {
            name: 'Ficha revisada',
            type: 'SAFETY_DATA_SHEET',
            fileReference: 'documents/revised.pdf',
            scopes: [{ type: 'SHIPMENT' }],
            issuedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...payload, status: 'COMPLIANT' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...payload, shipmentId: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/shipment-documents')
      .query({ pageSize: 101 })
      .expect(400);
    await request(app.getHttpServer()).delete(documentPath).expect(204);
    await request(app.getHttpServer()).get(documentPath).expect(404);
  });

  it('documents resource methods, input DTOs and error responses without design metadata', () => {
    const specification = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Documents').setVersion('1').build(),
    );
    const collection = specification.paths['/chemical-products/{id}/documents'];
    const resource =
      specification.paths['/chemical-products/{id}/documents/{documentId}'];
    expect(Object.keys(collection).sort()).toEqual(['get', 'post']);
    expect(Object.keys(resource).sort()).toEqual(['delete', 'get', 'patch']);
    expect(collection.post?.responses).toHaveProperty('201');
    expect(resource.patch?.responses).toMatchObject({
      200: expect.any(Object),
      400: expect.any(Object),
      404: expect.any(Object),
      422: expect.any(Object),
    });
    expect(
      specification.components?.schemas?.UpdateProductDocumentDto,
    ).toMatchObject({
      properties: {
        number: { maxLength: 80 },
        filePath: { maxLength: 500 },
        expiresAt: { nullable: true },
      },
    });
    expect(
      specification.paths['/shipment-documents'].post?.requestBody,
    ).toBeDefined();
    expect(specification.paths['/shipment-documents'].get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'shipmentId' }),
        expect.objectContaining({ name: 'pageSize' }),
      ]),
    );
  });
});
