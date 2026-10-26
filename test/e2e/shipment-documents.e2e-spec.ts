import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { DocumentComplianceModule } from '@/modules/document-compliance/document-compliance.module.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { ShipmentDocumentRepositoryMock } from '../mocks/shipment-document-repository.mock.js';
import { UserModule } from '@/modules/user/user.module.js';
import { USER_DIRECTORY } from '@/modules/user/public/index.js';
import { UserDirectoryMock } from '../mocks/user-directory.mock.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';
import {
  createShipmentDocumentData,
  SHIPPER_ID,
} from '../mocks/shipment-document.fixture.js';

const attachmentPayload = () => ({
  name: 'Ficha de segurança',
  type: 'SAFETY_DATA_SHEET',
  fileReference: 'documents/safety.pdf',
  scopes: [{ type: 'SHIPMENT' }],
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: null,
});
const documentPayload = () => ({
  shipmentId: randomUUID(),
  shipperId: SHIPPER_ID,
  compositionVersion: 1,
  attachments: [attachmentPayload()],
});

describe('ShipmentDocumentsController (e2e)', () => {
  let app: INestApplication;
  let documents: ShipmentDocumentRepositoryMock;
  let users: UserRepositoryMock;
  let responsibleUser: User;

  beforeEach(async () => {
    users = new UserRepositoryMock();
    responsibleUser = await users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@example.com',
        passwordHash: 'internal-password-hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
    documents = new ShipmentDocumentRepositoryMock();
    const moduleFixture = await Test.createTestingModule({
      imports: [DocumentComplianceModule],
    })
      .overrideModule(UserModule)
      .useModule({
        module: class TestUserModule {},
        providers: [
          { provide: USER_DIRECTORY, useValue: new UserDirectoryMock(users) },
        ],
        exports: [USER_DIRECTORY],
      })
      .overrideProvider(SHIPMENT_DOCUMENT_REPOSITORY)
      .useValue(documents)
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('executa o CRUD com 201/200/204, Location e histórico de substituição', async () => {
    const payload = documentPayload();
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(payload)
      .expect(201);
    const id = created.body.id as string;
    const originalId = created.body.attachments[0].id as string;
    expect(created.headers.location).toBe(`/shipment-documents/${id}`);
    expect(created.body).toMatchObject({
      shipmentId: payload.shipmentId,
      shipperId: SHIPPER_ID,
      status: 'PENDING',
      submittedAt: null,
    });
    expect(created.body.revision).toBeUndefined();
    expect(created.body.attachments[0].issuedAt).toBe(
      payload.attachments[0].issuedAt,
    );
    expect(created.body.attachments[0]).toMatchObject({
      expiresAt: null,
      replacesAttachmentId: null,
      removedAt: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    await request(app.getHttpServer())
      .get(created.headers.location)
      .expect(200);
    const updated = await request(app.getHttpServer())
      .patch(`/shipment-documents/${id}`)
      .send({
        attachments: [
          {
            ...attachmentPayload(),
            name: 'Ficha revisada',
            replacesAttachmentId: originalId,
            fileReference: 'documents/revised.pdf',
          },
        ],
      })
      .expect(200);
    expect(updated.body.attachments).toHaveLength(2);
    expect(updated.body.attachments[0]).toMatchObject({
      id: originalId,
      fileReference: 'documents/safety.pdf',
      removedAt: expect.any(String),
    });
    expect(updated.body.attachments[1]).toMatchObject({
      name: 'Ficha revisada',
      replacesAttachmentId: originalId,
      removedAt: null,
    });
    const replacementId = updated.body.attachments[1].id as string;
    await request(app.getHttpServer())
      .patch(`/shipment-documents/${id}`)
      .send({ removeAttachmentIds: [replacementId] })
      .expect(200);
    const removed = await request(app.getHttpServer())
      .delete(`/shipment-documents/${id}`)
      .expect(204);
    expect(removed.text).toBe('');
    await request(app.getHttpServer())
      .get(`/shipment-documents/${id}`)
      .expect(404);
  });

  it('creates, reads, lists and updates the responsible user without exposing internal data', async () => {
    const summary = { id: responsibleUser.id, name: responsibleUser.name };
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({
        ...documentPayload(),
        responsibleUserId: responsibleUser.id.toUpperCase(),
      })
      .expect(201);
    const path = `/shipment-documents/${created.body.id}`;
    const found = await request(app.getHttpServer()).get(path).expect(200);
    const listed = await request(app.getHttpServer())
      .get('/shipment-documents')
      .expect(200);
    for (const body of [created.body, found.body, listed.body.items[0]]) {
      expect(body.responsibleUserId).toBe(responsibleUser.id);
      expect(body.responsibleUser).toEqual(summary);
      expect(JSON.stringify(body)).not.toMatch(
        /passwordHash|internal-password-hash|maria@example.com|token|credential/i,
      );
    }
    const preserved = await request(app.getHttpServer())
      .patch(path)
      .send({ attachments: [attachmentPayload()] })
      .expect(200);
    expect(preserved.body.responsibleUser).toEqual(summary);

    const replacement = await users.create(
      User.create({
        name: 'João Santos',
        email: 'joao@example.com',
        passwordHash: 'other-hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
    const updated = await request(app.getHttpServer())
      .patch(path)
      .send({ responsibleUserId: replacement.id.toUpperCase() })
      .expect(200);
    expect(updated.body.responsibleUserId).toBe(replacement.id);
    expect(updated.body.responsibleUser).toEqual({
      id: replacement.id,
      name: replacement.name,
    });
    expect(updated.body.attachments).toEqual(preserved.body.attachments);
    const after = await request(app.getHttpServer()).get(path).expect(200);
    expect(after.body.responsibleUser).toEqual(updated.body.responsibleUser);
  });

  it('preserves legacy documents and allows assigning the same user to multiple documents', async () => {
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(documentPayload())
      .expect(201);
    expect(created.body.responsibleUserId).toBeNull();
    expect(created.body.responsibleUser).toBeNull();
    await request(app.getHttpServer())
      .patch(`/shipment-documents/${created.body.id}`)
      .send({ responsibleUserId: responsibleUser.id })
      .expect(200);
    await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...documentPayload(), responsibleUserId: responsibleUser.id })
      .expect(201);
    const listed = await request(app.getHttpServer())
      .get('/shipment-documents')
      .expect(200);
    expect(listed.body.total).toBe(2);
    expect(
      listed.body.items.every(
        (item: { responsibleUserId: string }) =>
          item.responsibleUserId === responsibleUser.id,
      ),
    ).toBe(true);
  });

  it('preserva o documento e o identificador histórico quando o responsável deixa de existir', async () => {
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...documentPayload(), responsibleUserId: responsibleUser.id })
      .expect(201);
    await users.remove(responsibleUser.id);
    const path = `/shipment-documents/${created.body.id}`;
    const found = await request(app.getHttpServer()).get(path).expect(200);
    const page = await request(app.getHttpServer())
      .get('/shipment-documents')
      .expect(200);
    const updated = await request(app.getHttpServer())
      .patch(path)
      .send({ attachments: [attachmentPayload()] })
      .expect(200);
    for (const document of [found.body, page.body.items[0], updated.body]) {
      expect(document.responsibleUserId).toBe(responsibleUser.id);
      expect(document.responsibleUser).toBeNull();
    }
  });

  it('rejects unknown users on create and update without changing persisted data', async () => {
    const unknownId = randomUUID();
    const rejected = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...documentPayload(), responsibleUserId: unknownId })
      .expect(404);
    expect(rejected.body.message).toContain('Responsável técnico');
    expect((await documents.list({ page: 1, pageSize: 20 })).total).toBe(0);
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...documentPayload(), responsibleUserId: responsibleUser.id })
      .expect(201);
    const path = `/shipment-documents/${created.body.id}`;
    await request(app.getHttpServer())
      .patch(path)
      .send({
        responsibleUserId: unknownId,
        attachments: [attachmentPayload()],
      })
      .expect(404);
    const after = await request(app.getHttpServer()).get(path).expect(200);
    expect(after.body).toEqual(created.body);
  });

  it.each([null, '', 'invalid', 42])(
    'rejects an invalid responsible user identifier on create and update: %j',
    async (responsibleUserId) => {
      await request(app.getHttpServer())
        .post('/shipment-documents')
        .send({ ...documentPayload(), responsibleUserId })
        .expect(400);
      const created = await request(app.getHttpServer())
        .post('/shipment-documents')
        .send(documentPayload())
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/shipment-documents/${created.body.id}`)
        .send({ responsibleUserId })
        .expect(400);
    },
  );

  it('permite iniciar a preparação vazia e adicionar anexos de um item depois', async () => {
    const payload = documentPayload();
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...payload, attachments: [] })
      .expect(201);
    expect(created.body.attachments).toEqual([]);
    const shipmentItemId = randomUUID();
    const updated = await request(app.getHttpServer())
      .patch(`/shipment-documents/${created.body.id}`)
      .send({
        attachments: [
          {
            ...attachmentPayload(),
            scopes: [{ type: 'SHIPMENT_ITEM', shipmentItemId }],
          },
        ],
      })
      .expect(200);
    expect(updated.body.attachments[0].scopes).toEqual([
      { type: 'SHIPMENT_ITEM', shipmentItemId },
    ]);
  });

  it('retorna 409 para carga duplicada', async () => {
    const payload = documentPayload();
    await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(payload)
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...payload, shipmentId: payload.shipmentId.toUpperCase() })
      .expect(409);
    expect(response.body.message).toBe(
      'Já existe documentação cadastrada para esta carga.',
    );
  });

  it('lista com padrões, filtros combinados e páginas sem repetição', async () => {
    const first = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(documentPayload())
      .expect(201);
    await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(documentPayload())
      .expect(201);
    await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...documentPayload(), shipperId: randomUUID() })
      .expect(201);
    const page = await request(app.getHttpServer())
      .get('/shipment-documents')
      .expect(200);
    expect(page.body).toMatchObject({ total: 3, page: 1, pageSize: 20 });
    const query = { shipperId: SHIPPER_ID, status: 'PENDING', pageSize: 1 };
    const page1 = await request(app.getHttpServer())
      .get('/shipment-documents')
      .query({ ...query, page: 1 })
      .expect(200);
    const page2 = await request(app.getHttpServer())
      .get('/shipment-documents')
      .query({ ...query, page: 2 })
      .expect(200);
    expect(page1.body.total).toBe(2);
    expect(page2.body.items[0].id).not.toBe(page1.body.items[0].id);
    const filtered = await request(app.getHttpServer())
      .get('/shipment-documents')
      .query({ ...query, shipmentId: first.body.shipmentId })
      .expect(200);
    expect(filtered.body.total).toBe(1);
    const empty = await request(app.getHttpServer())
      .get('/shipment-documents')
      .query({ status: 'UNDER_REVIEW' })
      .expect(200);
    expect(empty.body).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it.each([
    { shipmentId: 'inválido' },
    { shipperId: null },
    { compositionVersion: 0 },
    { compositionVersion: '1' },
    { compositionVersion: 2147483648 },
    { attachments: null },
    { attachments: [null] },
    { status: 'COMPLIANT' },
    { extra: true },
  ])('retorna 400 para cadastro inválido: %j', async (overrides) => {
    const response = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send({ ...documentPayload(), ...overrides })
      .expect(400);
    expect(response.body.message).toBeDefined();
    expect(JSON.stringify(response.body.message)).not.toContain(
      'should not exist',
    );
    expect((await documents.list({ page: 1, pageSize: 20 })).total).toBe(0);
  });

  it.each([
    { name: ' ' },
    { name: 'a'.repeat(181) },
    { fileReference: ' ' },
    { type: 'INVALID' },
    { issuedAt: '2026-02-30' },
    { issuedAt: null },
    { expiresAt: '2025-01-01T00:00:00Z' },
    { scopes: [] },
    { scopes: [null] },
    { scopes: [{ type: 'SHIPMENT_ITEM' }] },
    { scopes: [{ type: 'SHIPMENT', shipmentItemId: randomUUID() }] },
    { scopes: [{ type: 'SHIPMENT' }, { type: 'SHIPMENT' }] },
    { replacesAttachmentId: null },
  ])(
    'valida DTOs aninhados e invariantes com status 400: %j',
    async (overrides) => {
      await request(app.getHttpServer())
        .post('/shipment-documents')
        .send({
          ...documentPayload(),
          attachments: [{ ...attachmentPayload(), ...overrides }],
        })
        .expect(400);
    },
  );

  it.each([
    { page: 0 },
    { page: 1.5 },
    { pageSize: 101 },
    { pageSize: 'abc' },
    { shipmentId: 'inválido' },
    { status: 'INVALID' },
    { page: Number.MAX_SAFE_INTEGER, pageSize: 100 },
  ])('retorna 400 para consulta inválida: %j', async (query) => {
    await request(app.getHttpServer())
      .get('/shipment-documents')
      .query(query)
      .expect(400);
  });

  it('retorna 404 para UUID inexistente em consulta, atualização e exclusão', async () => {
    const path = `/shipment-documents/${randomUUID()}`;
    await request(app.getHttpServer()).get(path).expect(404);
    await request(app.getHttpServer())
      .patch(path)
      .send({ attachments: [attachmentPayload()] })
      .expect(404);
    await request(app.getHttpServer()).delete(path).expect(404);
  });

  it('retorna 400 para identificador malformado nos três verbos', async () => {
    const path = '/shipment-documents/invalid';
    const response = await request(app.getHttpServer()).get(path).expect(400);
    expect(response.body.message).toBe(
      'O identificador deve ser um UUID válido.',
    );
    await request(app.getHttpServer())
      .patch(path)
      .send({ attachments: [attachmentPayload()] })
      .expect(400);
    await request(app.getHttpServer()).delete(path).expect(400);
  });

  it.each([
    {},
    { attachments: [] },
    { attachments: null },
    { removeAttachmentIds: null },
    { shipmentId: randomUUID() },
    { status: 'COMPLIANT' },
    { submittedAt: '2026-01-01' },
  ])(
    'rejeita PATCH vazio, nulo ou de campos protegidos: %j',
    async (payload) => {
      const created = await request(app.getHttpServer())
        .post('/shipment-documents')
        .send(documentPayload())
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/shipment-documents/${created.body.id}`)
        .send(payload)
        .expect(400);
    },
  );

  it('não modifica o agregado quando uma substituição falha', async () => {
    const created = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(documentPayload())
      .expect(201);
    const path = `/shipment-documents/${created.body.id}`;
    await request(app.getHttpServer())
      .patch(path)
      .send({
        removeAttachmentIds: [created.body.attachments[0].id],
        attachments: [{ ...attachmentPayload(), name: ' ' }],
      })
      .expect(400);
    const after = await request(app.getHttpServer()).get(path).expect(200);
    expect(after.body).toEqual(created.body);
  });

  it('retorna 409 para referência a anexo de outra documentação', async () => {
    const first = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(documentPayload())
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/shipment-documents')
      .send(documentPayload())
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/shipment-documents/${first.body.id}`)
      .send({
        attachments: [
          {
            ...attachmentPayload(),
            replacesAttachmentId: second.body.attachments[0].id,
          },
        ],
      })
      .expect(409);
  });

  it.each([
    ShipmentDocumentStatus.UNDER_REVIEW,
    ShipmentDocumentStatus.COMPLIANT,
    ShipmentDocumentStatus.NON_COMPLIANT,
  ])('retorna 409 ao editar ou excluir documentação em %s', async (status) => {
    const document = await documents.create(
      ShipmentDocument.restore({
        ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
        status,
        submittedAt: new Date(),
      }),
    );
    const path = `/shipment-documents/${document.id}`;
    await request(app.getHttpServer())
      .patch(path)
      .send({ attachments: [attachmentPayload()] })
      .expect(409);
    await request(app.getHttpServer()).delete(path).expect(409);
    const response = await request(app.getHttpServer()).get(path).expect(200);
    expect(response.body.status).toBe(status);
  });

  it('expõe o contrato Swagger com recursos, verbos, respostas e DTOs', () => {
    const specification = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Teste').setVersion('1').build(),
    );
    expect(
      Object.keys(specification.paths['/shipment-documents']).sort(),
    ).toEqual(['get', 'post']);
    expect(
      Object.keys(specification.paths['/shipment-documents/{id}']).sort(),
    ).toEqual(['delete', 'get', 'patch']);
    expect(
      specification.paths['/shipment-documents'].post?.responses,
    ).toHaveProperty('201');
    expect(
      specification.paths['/shipment-documents/{id}'].patch?.responses,
    ).toMatchObject({
      200: expect.any(Object),
      400: expect.any(Object),
      404: expect.any(Object),
      409: expect.any(Object),
    });
    expect(
      specification.paths['/shipment-documents/{id}'].delete?.responses,
    ).toHaveProperty('204');
    expect(specification.components?.schemas).toHaveProperty(
      'ShipmentDocumentPageResponseDto',
    );
    expect(
      specification.components?.schemas?.CreateShipmentDocumentDto,
    ).not.toHaveProperty('properties.status');
    expect(
      specification.components?.schemas?.ShipmentDocumentResponseDto,
    ).toMatchObject({
      required: expect.arrayContaining([
        'shipmentId',
        'shipperId',
        'compositionVersion',
        'attachments',
      ]),
    });
    expect(
      specification.components?.schemas?.UpdateShipmentDocumentDto,
    ).toMatchObject({
      properties: {
        attachments: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateDocumentAttachmentDto' },
        },
      },
    });
    expect(
      specification.components?.schemas?.UpdateShipmentDocumentDto,
    ).not.toHaveProperty('properties.shipmentId');
    expect(
      specification.paths['/shipment-documents'].post?.responses,
    ).toHaveProperty('404');
    for (const name of [
      'CreateShipmentDocumentDto',
      'UpdateShipmentDocumentDto',
    ]) {
      expect(specification.components?.schemas?.[name]).toMatchObject({
        properties: { responsibleUserId: { type: 'string', format: 'uuid' } },
      });
      expect(specification.components?.schemas?.[name]).not.toHaveProperty(
        'required',
        expect.arrayContaining(['responsibleUserId']),
      );
    }
    expect(
      specification.components?.schemas?.ShipmentDocumentResponseDto,
    ).toMatchObject({
      properties: {
        responsibleUserId: { type: 'string', format: 'uuid', nullable: true },
        responsibleUser: { nullable: true },
      },
    });
    expect(
      specification.components?.schemas?.ShipmentDocumentResponsibleUserDto,
    ).toMatchObject({
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
      },
    });
    expect(
      specification.components?.schemas?.DocumentAttachmentResponseDto,
    ).toMatchObject({
      required: expect.arrayContaining([
        'name',
        'type',
        'fileReference',
        'scopes',
        'issuedAt',
        'expiresAt',
        'replacesAttachmentId',
      ]),
      properties: {
        issuedAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
        replacesAttachmentId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
        },
      },
    });
  });
});
