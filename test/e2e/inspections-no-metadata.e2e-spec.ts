import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { disableDesignMetadata } from '../mocks/design-metadata.mock.js';

const SHIPMENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const INSPECTOR_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

/**
 * Executa os endpoints de inspeção como no `npm run start:dev` com tsx, que
 * não emite a metadata `design:*`: a injeção de dependências, o filtro de
 * erros e a validação dependem só do que está declarado explicitamente.
 *
 * Assim como no main.ts, apenas o ValidationPipe é global; os erros de domínio
 * são tratados pelo filtro declarado no controller.
 */
describe('InspectionsController sem a metadata de decorators (e2e)', () => {
  let app: INestApplication;

  const payload = {
    shipmentId: SHIPMENT_ID,
    compositionVersion: 1,
    scope: 'SHIPMENT',
    inspectorId: INSPECTOR_ID,
    requirements: ['PACKAGING_INTEGRITY', 'NO_LEAKAGE'],
  };

  beforeAll(async () => {
    disableDesignMetadata();
    // Os casos de uso registram os erros esperados (404, 422) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const { InspectionModule } =
      await import('@/modules/inspection/inspection.module.js');
    const { INSPECTION_REPOSITORY } =
      await import('@/modules/inspection/domain/repositories/inspection.repository.js');
    const { InspectionRepositoryMock } =
      await import('../mocks/inspection-repository.mock.js');

    const { PrismaService } =
      await import('@/shared/infrastructure/persistence/prisma/prisma.service.js');
    const { createPrismaServiceStub } =
      await import('../mocks/prisma-service.mock.js');

    const moduleFixture = await Test.createTestingModule({
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
    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('cadastra, conclui e consulta uma inspeção', async () => {
    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload)
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({
        status: 'IN_PROGRESS',
        results: [{ requirement: 'PACKAGING_INTEGRITY', result: 'COMPLIANT' }],
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${id}`)
      .send({
        status: 'COMPLETED',
        results: [
          {
            requirement: 'NO_LEAKAGE',
            result: 'NON_COMPLIANT',
            observation: 'Vazamento na válvula do tambor 3',
          },
        ],
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('COMPLETED');
      });

    await request(app.getHttpServer()).get(`/inspecoes/${id}`).expect(200);
  });

  it('traduz os erros de domínio para 404 e 422', async () => {
    await request(app.getHttpServer())
      .get('/inspecoes/id-inexistente')
      .expect(404);
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({ ...payload, scope: 'SHIPMENT_ITEM' })
      .expect(422);

    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${created.body.id}`)
      .send({ status: 'COMPLETED' })
      .expect(422);
  });

  it('valida o corpo do cadastro e os resultados aninhados da atualização', async () => {
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({ ...payload, shipmentId: 'nao-e-uuid' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inspecoes')
      .send({ ...payload, extra: true })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/inspecoes')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/inspecoes/${created.body.id}`)
      .send({ results: [{ requirement: 'NO_LEAKAGE', result: 'TALVEZ' }] })
      .expect(400);
  });

  it('valida e converte os parâmetros da listagem', async () => {
    await request(app.getHttpServer()).get('/inspecoes?page=0').expect(400);

    const response = await request(app.getHttpServer())
      .get(
        `/inspecoes?shipmentId=${SHIPMENT_ID}&status=PENDING&page=1&pageSize=20`,
      )
      .expect(200);

    expect(response.body).toMatchObject({ page: 1, pageSize: 20 });
  });
});
