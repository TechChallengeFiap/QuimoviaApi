import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import request from 'supertest';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import { InspectionModule } from '@/modules/inspection/inspection.module.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { InspectionRepositoryMock } from '../mocks/inspection-repository.mock.js';
import { createPrismaServiceStub } from '../mocks/prisma-service.mock.js';

const SHIPMENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const SHIPMENT_ITEM_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const INSPECTOR_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

describe('InspectionsController (e2e)', () => {
  let app: INestApplication;

  const payload = {
    shipmentId: SHIPMENT_ID,
    compositionVersion: 1,
    scope: 'SHIPMENT',
    inspectorId: INSPECTOR_ID,
    requirements: ['PACKAGING_INTEGRITY', 'NO_LEAKAGE'],
  };

  beforeEach(async () => {
    // Os casos de uso registram os erros esperados (404, 422) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InspectionModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaServiceStub())
      .overrideProvider(INSPECTION_REPOSITORY)
      .useClass(InspectionRepositoryMock)
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
    jest.restoreAllMocks();
    await app.close();
  });

  it('cadastra uma inspeção pendente com as verificações sem resultado', async () => {
    const response = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      shipmentId: SHIPMENT_ID,
      compositionVersion: 1,
      scope: 'SHIPMENT',
      shipmentItemId: null,
      inspectorId: INSPECTOR_ID,
      status: 'PENDING',
      startedAt: null,
      completedAt: null,
      items: [
        { requirement: 'PACKAGING_INTEGRITY', result: null, observation: null },
        { requirement: 'NO_LEAKAGE', result: null, observation: null },
      ],
    });
  });

  it('cadastra a inspeção de um item da carga', async () => {
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({
        ...payload,
        scope: 'SHIPMENT_ITEM',
        shipmentItemId: SHIPMENT_ITEM_ID,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.shipmentItemId).toBe(SHIPMENT_ITEM_ID);
      });
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({
        shipmentId: 'nao-e-uuid',
        compositionVersion: 0,
        scope: 'PORTO',
        inspectorId: INSPECTOR_ID,
        requirements: [],
      })
      .expect(400);
  });

  it('rejeita verificações repetidas', async () => {
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({ ...payload, requirements: ['NO_LEAKAGE', 'NO_LEAKAGE'] })
      .expect(400);
  });

  it('retorna 422 quando o escopo de item não informa o item da carga', async () => {
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({ ...payload, scope: 'SHIPMENT_ITEM' })
      .expect(422);
  });

  it('busca uma inspeção pelo id e retorna 404 para id inexistente', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload);

    await request(app.getHttpServer())
      .get(`/inspecoes/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(created.body.id);
        expect(body.items).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .get('/inspecoes/id-inexistente')
      .expect(404);
  });

  it('lista as inspeções paginadas e filtradas pela carga', async () => {
    const otherShipmentId = '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b';
    await request(app.getHttpServer()).post('/inspecoes').send(payload);
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({ ...payload, shipmentId: otherShipmentId });

    const response = await request(app.getHttpServer())
      .get(`/inspecoes?shipmentId=${otherShipmentId}&page=1&pageSize=10`)
      .expect(200);

    expect(response.body).toMatchObject({ total: 1, page: 1, pageSize: 10 });
    expect(response.body.items[0].shipmentId).toBe(otherShipmentId);
  });

  it('rejeita filtros inválidos na listagem', async () => {
    await request(app.getHttpServer())
      .get('/inspecoes?shipmentId=nao-e-uuid&pageSize=500')
      .expect(400);
  });

  it('inicia, registra os resultados e conclui uma inspeção', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('IN_PROGRESS');
        expect(body.startedAt).not.toBeNull();
      });

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({
        results: [
          { requirement: 'PACKAGING_INTEGRITY', result: 'COMPLIANT' },
          {
            requirement: 'NO_LEAKAGE',
            result: 'NON_COMPLIANT',
            observation: 'Vazamento na válvula do tambor 3',
          },
        ],
        status: 'COMPLETED',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('COMPLETED');
        expect(body.completedAt).not.toBeNull();
        expect(body.items).toEqual([
          {
            requirement: 'PACKAGING_INTEGRITY',
            result: 'COMPLIANT',
            observation: null,
          },
          {
            requirement: 'NO_LEAKAGE',
            result: 'NON_COMPLIANT',
            observation: 'Vazamento na válvula do tambor 3',
          },
        ]);
      });

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({ inspectorId: INSPECTOR_ID })
      .expect(422);
  });

  it('aplica as regras de negócio na atualização', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({
        results: [{ requirement: 'NO_LEAKAGE', result: 'COMPLIANT' }],
      })
      .expect(422);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({
        status: 'IN_PROGRESS',
        results: [{ requirement: 'NO_LEAKAGE', result: 'NON_COMPLIANT' }],
      })
      .expect(422);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({ status: 'COMPLETED' })
      .expect(422);
  });

  it('rejeita payload inválido na atualização', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${created.body.id}`)
      .send({ status: 'XPTO' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${created.body.id}`)
      .send({
        results: [
          { requirement: 'NO_LEAKAGE', result: 'COMPLIANT' },
          { requirement: 'NO_LEAKAGE', result: 'COMPLIANT' },
        ],
      })
      .expect(400);
  });

  it('retorna 404 ao atualizar uma inspeção inexistente', async () => {
    await request(app.getHttpServer())
      .patch('/inspecoes/id-inexistente')
      .send({ status: 'IN_PROGRESS' })
      .expect(404);
  });

  it('remove uma inspeção pendente e passa a retornar 404 nas buscas', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload);
    const id = created.body.id as string;

    await request(app.getHttpServer()).delete(`/inspecoes/${id}`).expect(204);
    await request(app.getHttpServer()).get(`/inspecoes/${id}`).expect(404);
  });

  it('não remove uma inspeção já iniciada', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app.getHttpServer()).delete(`/inspecoes/${id}`).expect(422);
    await request(app.getHttpServer()).get(`/inspecoes/${id}`).expect(200);
  });

  it('retorna 404 ao remover uma inspeção inexistente', async () => {
    await request(app.getHttpServer())
      .delete('/inspecoes/id-inexistente')
      .expect(404);
  });
});
