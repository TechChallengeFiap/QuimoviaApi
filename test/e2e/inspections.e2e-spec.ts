import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import { InspectionModule } from '@/modules/inspection/inspection.module.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { InspectionRepositoryMock } from '../mocks/inspection-repository.mock.js';

const CARGO_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const CARGO_ITEM_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const INSPECTOR_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

describe('InspectionsController (e2e)', () => {
  let app: INestApplication;

  const payload = {
    cargoId: CARGO_ID,
    compositionVersion: 1,
    scope: 'CARGO',
    inspectorId: INSPECTOR_ID,
    requirements: ['PACKAGING_INTEGRITY', 'NO_LEAKAGE'],
  };

  beforeEach(async () => {
    // Os casos de uso registram os erros esperados (404, 422) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InspectionModule],
    })
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
      cargoId: CARGO_ID,
      compositionVersion: 1,
      scope: 'CARGO',
      cargoItemId: null,
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
      .send({ ...payload, scope: 'CARGO_ITEM', cargoItemId: CARGO_ITEM_ID })
      .expect(201)
      .expect(({ body }) => {
        expect(body.cargoItemId).toBe(CARGO_ITEM_ID);
      });
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({
        cargoId: 'nao-e-uuid',
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
      .send({ ...payload, scope: 'CARGO_ITEM' })
      .expect(422);
  });
});
