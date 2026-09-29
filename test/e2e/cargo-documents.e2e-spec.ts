import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { DocumentComplianceModule } from '@/modules/document-compliance/document-compliance.module.js';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { CargoDocumentRepositoryMock } from '../mocks/cargo-document-repository.mock.js';
import {
  createCargoDocumentData,
  SHIPPER_ID,
} from '../mocks/cargo-document.fixture.js';

const attachmentPayload = () => ({
  name: 'Ficha de segurança',
  type: 'SAFETY_DATA_SHEET',
  fileReference: 'documents/safety.pdf',
  scopes: [{ type: 'CARGO' }],
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: null,
});
const documentPayload = () => ({
  cargoId: randomUUID(),
  shipperId: SHIPPER_ID,
  compositionVersion: 1,
  attachments: [attachmentPayload()],
});

describe('CargoDocumentsController (e2e)', () => {
  let app: INestApplication;
  let documents: CargoDocumentRepositoryMock;

  beforeEach(async () => {
    documents = new CargoDocumentRepositoryMock();
    const moduleFixture = await Test.createTestingModule({
      imports: [DocumentComplianceModule],
    })
      .overrideProvider(CARGO_DOCUMENT_REPOSITORY)
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
      .post('/cargo-documents')
      .send(payload)
      .expect(201);
    const id = created.body.id as string;
    const originalId = created.body.attachments[0].id as string;
    expect(created.headers.location).toBe(`/cargo-documents/${id}`);
    expect(created.body).toMatchObject({
      cargoId: payload.cargoId,
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
      .patch(`/cargo-documents/${id}`)
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
      .patch(`/cargo-documents/${id}`)
      .send({ removeAttachmentIds: [replacementId] })
      .expect(200);
    const removed = await request(app.getHttpServer())
      .delete(`/cargo-documents/${id}`)
      .expect(204);
    expect(removed.text).toBe('');
    await request(app.getHttpServer())
      .get(`/cargo-documents/${id}`)
      .expect(404);
  });

  it('permite iniciar a preparação vazia e adicionar anexos de um item depois', async () => {
    const payload = documentPayload();
    const created = await request(app.getHttpServer())
      .post('/cargo-documents')
      .send({ ...payload, attachments: [] })
      .expect(201);
    expect(created.body.attachments).toEqual([]);
    const cargoItemId = randomUUID();
    const updated = await request(app.getHttpServer())
      .patch(`/cargo-documents/${created.body.id}`)
      .send({
        attachments: [
          {
            ...attachmentPayload(),
            scopes: [{ type: 'CARGO_ITEM', cargoItemId }],
          },
        ],
      })
      .expect(200);
    expect(updated.body.attachments[0].scopes).toEqual([
      { type: 'CARGO_ITEM', cargoItemId },
    ]);
  });

  it('retorna 409 para carga duplicada', async () => {
    const payload = documentPayload();
    await request(app.getHttpServer())
      .post('/cargo-documents')
      .send(payload)
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/cargo-documents')
      .send({ ...payload, cargoId: payload.cargoId.toUpperCase() })
      .expect(409);
    expect(response.body.message).toBe(
      'Já existe documentação cadastrada para esta carga.',
    );
  });

  it('lista com padrões, filtros combinados e páginas sem repetição', async () => {
    const first = await request(app.getHttpServer())
      .post('/cargo-documents')
      .send(documentPayload())
      .expect(201);
    await request(app.getHttpServer())
      .post('/cargo-documents')
      .send(documentPayload())
      .expect(201);
    await request(app.getHttpServer())
      .post('/cargo-documents')
      .send({ ...documentPayload(), shipperId: randomUUID() })
      .expect(201);
    const page = await request(app.getHttpServer())
      .get('/cargo-documents')
      .expect(200);
    expect(page.body).toMatchObject({ total: 3, page: 1, pageSize: 20 });
    const query = { shipperId: SHIPPER_ID, status: 'PENDING', pageSize: 1 };
    const page1 = await request(app.getHttpServer())
      .get('/cargo-documents')
      .query({ ...query, page: 1 })
      .expect(200);
    const page2 = await request(app.getHttpServer())
      .get('/cargo-documents')
      .query({ ...query, page: 2 })
      .expect(200);
    expect(page1.body.total).toBe(2);
    expect(page2.body.items[0].id).not.toBe(page1.body.items[0].id);
    const filtered = await request(app.getHttpServer())
      .get('/cargo-documents')
      .query({ ...query, cargoId: first.body.cargoId })
      .expect(200);
    expect(filtered.body.total).toBe(1);
    const empty = await request(app.getHttpServer())
      .get('/cargo-documents')
      .query({ status: 'UNDER_REVIEW' })
      .expect(200);
    expect(empty.body).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it.each([
    { cargoId: 'inválido' },
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
      .post('/cargo-documents')
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
    { scopes: [{ type: 'CARGO_ITEM' }] },
    { scopes: [{ type: 'CARGO', cargoItemId: randomUUID() }] },
    { scopes: [{ type: 'CARGO' }, { type: 'CARGO' }] },
    { replacesAttachmentId: null },
  ])(
    'valida DTOs aninhados e invariantes com status 400: %j',
    async (overrides) => {
      await request(app.getHttpServer())
        .post('/cargo-documents')
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
    { cargoId: 'inválido' },
    { status: 'INVALID' },
    { page: Number.MAX_SAFE_INTEGER, pageSize: 100 },
  ])('retorna 400 para consulta inválida: %j', async (query) => {
    await request(app.getHttpServer())
      .get('/cargo-documents')
      .query(query)
      .expect(400);
  });

  it('retorna 404 para UUID inexistente em consulta, atualização e exclusão', async () => {
    const path = `/cargo-documents/${randomUUID()}`;
    await request(app.getHttpServer()).get(path).expect(404);
    await request(app.getHttpServer())
      .patch(path)
      .send({ attachments: [attachmentPayload()] })
      .expect(404);
    await request(app.getHttpServer()).delete(path).expect(404);
  });

  it('retorna 400 para identificador malformado nos três verbos', async () => {
    const path = '/cargo-documents/invalid';
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
    { cargoId: randomUUID() },
    { status: 'COMPLIANT' },
    { submittedAt: '2026-01-01' },
  ])(
    'rejeita PATCH vazio, nulo ou de campos protegidos: %j',
    async (payload) => {
      const created = await request(app.getHttpServer())
        .post('/cargo-documents')
        .send(documentPayload())
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/cargo-documents/${created.body.id}`)
        .send(payload)
        .expect(400);
    },
  );

  it('não modifica o agregado quando uma substituição falha', async () => {
    const created = await request(app.getHttpServer())
      .post('/cargo-documents')
      .send(documentPayload())
      .expect(201);
    const path = `/cargo-documents/${created.body.id}`;
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
      .post('/cargo-documents')
      .send(documentPayload())
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/cargo-documents')
      .send(documentPayload())
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/cargo-documents/${first.body.id}`)
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
    CargoDocumentStatus.UNDER_REVIEW,
    CargoDocumentStatus.COMPLIANT,
    CargoDocumentStatus.NON_COMPLIANT,
  ])('retorna 409 ao editar ou excluir documentação em %s', async (status) => {
    const document = await documents.create(
      CargoDocument.restore({
        ...CargoDocument.create(createCargoDocumentData()).toObject(),
        status,
        submittedAt: new Date(),
      }),
    );
    const path = `/cargo-documents/${document.id}`;
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
    expect(Object.keys(specification.paths['/cargo-documents']).sort()).toEqual(
      ['get', 'post'],
    );
    expect(
      Object.keys(specification.paths['/cargo-documents/{id}']).sort(),
    ).toEqual(['delete', 'get', 'patch']);
    expect(
      specification.paths['/cargo-documents'].post?.responses,
    ).toHaveProperty('201');
    expect(
      specification.paths['/cargo-documents/{id}'].patch?.responses,
    ).toMatchObject({
      200: expect.any(Object),
      400: expect.any(Object),
      404: expect.any(Object),
      409: expect.any(Object),
    });
    expect(
      specification.paths['/cargo-documents/{id}'].delete?.responses,
    ).toHaveProperty('204');
    expect(specification.components?.schemas).toHaveProperty(
      'CargoDocumentPageResponseDto',
    );
    expect(
      specification.components?.schemas?.CreateCargoDocumentDto,
    ).not.toHaveProperty('properties.status');
    expect(
      specification.components?.schemas?.CargoDocumentResponseDto,
    ).toMatchObject({
      required: expect.arrayContaining([
        'cargoId',
        'shipperId',
        'compositionVersion',
        'attachments',
      ]),
    });
    expect(
      specification.components?.schemas?.UpdateCargoDocumentDto,
    ).toMatchObject({
      properties: {
        attachments: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateDocumentAttachmentDto' },
        },
      },
    });
    expect(
      specification.components?.schemas?.UpdateCargoDocumentDto,
    ).not.toHaveProperty('properties.cargoId');
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
