import { jest } from '@jest/globals';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ChemicalShipmentModule } from '@/modules/chemical-shipment/chemical-shipment.module.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/config/auth.config.js';
import { USER_DIRECTORY } from '@/modules/user/public/index.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';
import { ChemicalShipmentMock } from '../mocks/chemical-shipment.mock.js';
import { createPrismaServiceStub } from '../mocks/prisma-service.mock.js';
import {
  UserDirectoryMock,
  userSummary,
} from '../mocks/user-directory.mock.js';

/**
 * Monta o ChemicalShipmentModule com as dependências reais: o UserModule,
 * importado pela API pública de Identidade e Acesso, e o PrismaModule. Só o
 * repositório de cargas, o contrato USER_DIRECTORY e o PrismaService são
 * substituídos, para que a rota HTTP seja testada sem banco de dados.
 */
describe('ChemicalShipmentController (e2e)', () => {
  let app: INestApplication;
  let shipments: ChemicalShipmentMock;

  const payload = {
    productId: 'prod-001',
    responsibleUserId: 'user-001',
    documentsIds: 'doc-001',
  };

  beforeEach(async () => {
    // Os casos de uso registram os erros esperados (404, 422) no log.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    shipments = new ChemicalShipmentMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ChemicalShipmentModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaServiceStub())
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .overrideProvider(CHEMICAL_SHIPMENT_REPOSITORY)
      .useValue(shipments)
      .overrideProvider(USER_DIRECTORY)
      .useValue(
        new UserDirectoryMock([
          userSummary({ id: 'user-001', name: 'Operador Teste' }),
          userSummary({ id: 'user-002', name: 'Segundo Operador' }),
        ]),
      )
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

  it('cadastra uma carga em análise e devolve o responsável, sem o hash da senha', async () => {
    const response = await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      productId: 'prod-001',
      status: 'ANALYZING',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
      deletedAt: null,
      responsibleUser: {
        id: 'user-001',
        name: 'Operador Teste',
        role: 'PORT_OPERATOR',
        status: 'ACTIVE',
      },
    });
    expect(response.body.responsibleUser).not.toHaveProperty('passwordHash');
  });

  it('responde 404 quando o responsável não existe', async () => {
    await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send({ ...payload, responsibleUserId: 'user-inexistente' })
      .expect(404);
  });

  it('responde 400 para um cadastro com identificador vazio', async () => {
    await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send({ ...payload, productId: '' })
      .expect(400);
  });

  it('lista as cargas com os dados de cada responsável', async () => {
    await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send(payload)
      .expect(201);
    await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send({ ...payload, responsibleUserId: 'user-002' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/chemical-shipment')
      .expect(200);

    expect(response.body).toMatchObject({ total: 2, page: 1, pageSize: 20 });
    expect(
      response.body.items.map(
        (item: { responsibleUser: { name: string } }) =>
          item.responsibleUser.name,
      ),
    ).toEqual(['Operador Teste', 'Segundo Operador']);
  });

  it('busca uma carga pelo id e responde 404 quando ela não existe', async () => {
    const created = await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/chemical-shipment/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.responsibleUser.name).toBe('Operador Teste');
      });
    await request(app.getHttpServer())
      .get('/chemical-shipment/id-inexistente')
      .expect(404);
  });

  it('responde 422 ao alterar uma carga já aprovada', async () => {
    const approved = ChemicalShipment.restore({
      id: 'ship-aprovada',
      productId: 'prod-001',
      status: StatusShipment.APPROVED,
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    await shipments.create(approved);

    await request(app.getHttpServer())
      .patch('/chemical-shipment/ship-aprovada')
      .send({ productId: 'prod-002' })
      .expect(422);
  });

  it('remove uma carga existente', async () => {
    const created = await request(app.getHttpServer())
      .post('/chemical-shipment')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/chemical-shipment/${created.body.id}`)
      .expect(200);
  });
});
