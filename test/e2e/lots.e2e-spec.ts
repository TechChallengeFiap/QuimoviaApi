import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { ChemicalProductsModule } from '@/modules/chemical-products/chemical-products.module.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { SESSION_REPOSITORY } from '@/modules/user/domain/repositories/session.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import { AUTH_CONFIG } from '@/modules/user/infrastructure/auth/auth.config.js';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter.js';
import { ChemicalProductRepositoryMock } from '../mocks/chemical-product-repository.mock.js';
import { LotRepositoryMock } from '../mocks/lot-repository.mock.js';
import { SessionRepositoryMock } from '../mocks/session-repository.mock.js';
import { UserRepositoryMock } from '../mocks/user-repository.mock.js';
import { TEST_AUTH_CONFIG } from '../mocks/auth-config.mock.js';

const activeProduct = {
  code: 'H2SO4-98',
  technicalName: 'Ácido sulfúrico',
  unNumber: '1830',
  riskClass: 'CORROSIVE_SUBSTANCES',
  physicalState: 'LIQUID',
  status: 'ACTIVE',
};

describe('LotsController (e2e)', () => {
  let app: INestApplication;
  let productId: string;
  let responsibleUserId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ChemicalProductsModule],
    })
      .overrideProvider(CHEMICAL_PRODUCT_REPOSITORY)
      .useClass(ChemicalProductRepositoryMock)
      .overrideProvider(LOT_REPOSITORY)
      .useClass(LotRepositoryMock)
      .overrideProvider(AUTH_CONFIG)
      .useValue(TEST_AUTH_CONFIG)
      .overrideProvider(USER_REPOSITORY)
      .useClass(UserRepositoryMock)
      .overrideProvider(SESSION_REPOSITORY)
      .useClass(SessionRepositoryMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();

    const users = app.get<UserRepositoryMock>(USER_REPOSITORY);
    const user = await users.create(
      User.create({
        name: 'Responsável Técnico',
        email: 'tecnico@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
    responsibleUserId = user.id;

    const created = await request(app.getHttpServer())
      .post('/chemical-products')
      .send({ ...activeProduct, responsibleUserId })
      .expect(201);
    productId = created.body.id as string;
  });

  afterEach(async () => {
    await app?.close();
  });

  const lotsUrl = () => `/chemical-products/${productId}/lots`;

  async function createLot(lotNumber = 'L2026-0001') {
    const response = await request(app.getHttpServer())
      .post(lotsUrl())
      .send({ lotNumber, quantity: 1500.5 })
      .expect(201);

    return response.body as { id: string; status: string };
  }

  /** Devolve o Test do supertest (não um Promise), para encadear `.expect()`. */
  function act(lotId: string, action: string, body?: object) {
    return request(app.getHttpServer()).post(`${lotsUrl()}/${lotId}/${action}`).send(body);
  }

  it('registra um lote RECEIVED, não movimentável, com o número normalizado', async () => {
    const response = await request(app.getHttpServer())
      .post(lotsUrl())
      .send({ lotNumber: 'l2026-0001', quantity: 1500.5 })
      .expect(201);

    expect(response.body).toMatchObject({
      chemicalProductId: productId,
      lotNumber: 'L2026-0001',
      quantity: 1500.5,
      status: 'RECEIVED',
      reservedForOperationId: null,
      movable: false,
    });
  });

  it('rejeita payload inválido, número duplicado e produto inexistente', async () => {
    await request(app.getHttpServer())
      .post(lotsUrl())
      .send({ lotNumber: 'L 1', quantity: 0 })
      .expect(400);

    await createLot('L1');
    await request(app.getHttpServer())
      .post(lotsUrl())
      .send({ lotNumber: 'l1', quantity: 1 })
      .expect(409);

    await request(app.getHttpServer())
      .post('/chemical-products/id-inexistente/lots')
      .send({ lotNumber: 'L1', quantity: 1 })
      .expect(404);
  });

  it('não registra lotes para produtos que não estão ativos', async () => {
    await request(app.getHttpServer()).post(`/chemical-products/${productId}/block`).expect(200);

    await request(app.getHttpServer())
      .post(lotsUrl())
      .send({ lotNumber: 'L1', quantity: 1 })
      .expect(422);
  });

  it('lista os lotes do produto com filtro por status, e busca por id', async () => {
    const received = await createLot('L1');
    const inspected = await createLot('L2');
    await act(inspected.id, 'start-inspection').expect(200);

    const all = await request(app.getHttpServer()).get(lotsUrl()).expect(200);
    expect(all.body).toMatchObject({ total: 2, page: 1, pageSize: 20 });

    const filtered = await request(app.getHttpServer())
      .get(lotsUrl())
      .query({ status: 'UNDER_INSPECTION' })
      .expect(200);
    expect(filtered.body.items.map((lot: { id: string }) => lot.id)).toEqual([inspected.id]);

    await request(app.getHttpServer()).get(`${lotsUrl()}/${received.id}`).expect(200);
    await request(app.getHttpServer()).get(`${lotsUrl()}/lote-inexistente`).expect(404);
  });

  it('corrige os dados de recebimento só durante a conferência e nunca o status', async () => {
    const lot = await createLot();

    await request(app.getHttpServer())
      .patch(`${lotsUrl()}/${lot.id}`)
      .send({ quantity: 1480, lotNumber: 'l2026-0001a' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.quantity).toBe(1480);
        expect(body.lotNumber).toBe('L2026-0001A');
      });

    await request(app.getHttpServer())
      .patch(`${lotsUrl()}/${lot.id}`)
      .send({ status: 'AVAILABLE' })
      .expect(400);

    await act(lot.id, 'start-inspection').expect(200);
    await act(lot.id, 'approve').expect(200);

    await request(app.getHttpServer())
      .patch(`${lotsUrl()}/${lot.id}`)
      .send({ quantity: 1 })
      .expect(422);
  });

  it('percorre o fluxo do lote: inspeção, aprovação, armazenamento, reserva e saída', async () => {
    const lot = await createLot();

    await act(lot.id, 'approve').expect(422);
    await act(lot.id, 'start-inspection').expect(200).expect(({ body }) => {
      expect(body.status).toBe('UNDER_INSPECTION');
    });
    await act(lot.id, 'approve').expect(200).expect(({ body }) => {
      expect(body.status).toBe('AVAILABLE');
      expect(body.movable).toBe(true);
    });

    await act(lot.id, 'store').expect(200).expect(({ body }) => {
      expect(body.status).toBe('IN_STORAGE');
      expect(body.movable).toBe(false);
    });
    await act(lot.id, 'release').expect(422);
    await act(lot.id, 'withdraw-from-storage').expect(200);

    await act(lot.id, 'reserve', {}).expect(400);
    await act(lot.id, 'reserve', { operationId: 'OP-1' }).expect(200).expect(({ body }) => {
      expect(body.status).toBe('RESERVED');
      expect(body.reservedForOperationId).toBe('OP-1');
      expect(body.movable).toBe(false);
    });

    await act(lot.id, 'release').expect(422);
    await act(lot.id, 'release', { operationId: 'OP-2' }).expect(422);
    await act(lot.id, 'release', { operationId: 'OP-1' }).expect(200).expect(({ body }) => {
      expect(body.status).toBe('RELEASED');
      expect(body.reservedForOperationId).toBeNull();
    });

    await act(lot.id, 'quarantine').expect(422);
  });

  it('cancela a reserva, coloca em quarentena, libera, vence e descarta', async () => {
    const lot = await createLot();
    await act(lot.id, 'start-inspection').expect(200);
    await act(lot.id, 'approve').expect(200);
    await act(lot.id, 'reserve', { operationId: 'OP-1' }).expect(200);

    await act(lot.id, 'cancel-reservation').expect(200).expect(({ body }) => {
      expect(body.status).toBe('AVAILABLE');
      expect(body.reservedForOperationId).toBeNull();
    });

    await act(lot.id, 'quarantine').expect(200).expect(({ body }) => {
      expect(body.status).toBe('QUARANTINED');
    });
    await act(lot.id, 'release-from-quarantine').expect(200).expect(({ body }) => {
      expect(body.status).toBe('AVAILABLE');
    });

    await act(lot.id, 'dispose').expect(422);
    await act(lot.id, 'expire').expect(200).expect(({ body }) => {
      expect(body.status).toBe('EXPIRED');
    });
    await act(lot.id, 'dispose').expect(200).expect(({ body }) => {
      expect(body.status).toBe('DISPOSED');
    });
    await act(lot.id, 'expire').expect(422);
  });

  it('não encontra um lote pela rota de outro produto', async () => {
    const lot = await createLot();
    const other = await request(app.getHttpServer())
      .post('/chemical-products')
      .send({ ...activeProduct, code: 'NH3-01', unNumber: '1005', responsibleUserId })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/chemical-products/${other.body.id}/lots/${lot.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/chemical-products/${other.body.id}/lots/${lot.id}/start-inspection`)
      .expect(404);
  });

  it('impede a exclusão de um produto com lotes em aberto, mas não com lotes finalizados', async () => {
    const lot = await createLot();

    await request(app.getHttpServer()).delete(`/chemical-products/${productId}`).expect(422);

    await act(lot.id, 'expire').expect(200);
    await act(lot.id, 'dispose').expect(200);

    await request(app.getHttpServer()).delete(`/chemical-products/${productId}`).expect(204);
    await request(app.getHttpServer()).get(lotsUrl()).expect(404);
  });
});
