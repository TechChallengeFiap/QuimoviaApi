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

const validProduct = {
  code: 'H2SO4-98',
  technicalName: 'Ácido sulfúrico',
  tradeName: 'Sulfurax 98',
  unNumber: '1830',
  riskClass: 'CORROSIVE_SUBSTANCES',
  physicalState: 'LIQUID',
};

const validDocument = {
  type: 'SAFETY_DATA_SHEET',
  number: 'FISPQ-2026-0001',
  expiresAt: '2027-12-31T00:00:00.000Z',
  filePath: 'documentos/produtos/acido-sulfurico/fispq.pdf',
};

describe('ChemicalProductsController (e2e)', () => {
  let app: INestApplication;
  let users: UserRepositoryMock;
  let responsibleUser: User;

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
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();

    users = app.get<UserRepositoryMock>(USER_REPOSITORY);
    responsibleUser = await users.create(
      User.create({
        name: 'Responsável Técnico',
        email: 'tecnico@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
  });

  afterEach(async () => {
    await app?.close();
  });

  async function createProduct(override: Record<string, unknown> = {}) {
    const response = await request(app.getHttpServer())
      .post('/chemical-products')
      .send({
        ...validProduct,
        responsibleUserId: responsibleUser.id,
        ...override,
      })
      .expect(201);

    return response.body as { id: string; documents: { id: string }[] };
  }

  it('cadastra um produto químico em análise, com o código normalizado e o responsável', async () => {
    const response = await request(app.getHttpServer())
      .post('/chemical-products')
      .send({
        ...validProduct,
        code: 'h2so4-98',
        responsibleUserId: responsibleUser.id,
        documents: [validDocument],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      code: 'H2SO4-98',
      technicalName: 'Ácido sulfúrico',
      tradeName: 'Sulfurax 98',
      unNumber: '1830',
      riskClass: 'CORROSIVE_SUBSTANCES',
      physicalState: 'LIQUID',
      status: 'UNDER_ANALYSIS',
      responsibleUserId: responsibleUser.id,
    });
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0]).toMatchObject({
      type: 'SAFETY_DATA_SHEET',
      number: 'FISPQ-2026-0001',
      expiresAt: '2027-12-31T00:00:00.000Z',
    });
  });

  it('rejeita o cadastro sem usuário responsável ou com usuário inexistente', async () => {
    await request(app.getHttpServer())
      .post('/chemical-products')
      .send(validProduct)
      .expect(400);

    await request(app.getHttpServer())
      .post('/chemical-products')
      .send({ ...validProduct, responsibleUserId: 'user-inexistente' })
      .expect(404);
  });

  it('rejeita a criação de um produto com código duplicado', async () => {
    await createProduct();
    await request(app.getHttpServer())
      .post('/chemical-products')
      .send({
        ...validProduct,
        responsibleUserId: responsibleUser.id,
        technicalName: 'Outro',
      })
      .expect(409);
  });

  it('rejeita payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/chemical-products')
      .send({
        ...validProduct,
        responsibleUserId: responsibleUser.id,
        unNumber: '12',
        riskClass: 'INEXISTENTE',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/chemical-products')
      .send({
        ...validProduct,
        responsibleUserId: responsibleUser.id,
        documents: [{ type: 'SAFETY_DATA_SHEET' }],
      })
      .expect(400);
  });

  it('busca um produto pelo id e retorna 404 para id inexistente', async () => {
    const created = await createProduct();

    await request(app.getHttpServer())
      .get(`/chemical-products/${created.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.code).toBe('H2SO4-98');
        expect(body.responsibleUserId).toBe(responsibleUser.id);
      });

    await request(app.getHttpServer())
      .get('/chemical-products/id-inexistente')
      .expect(404);
  });

  it('lista produtos paginados, com filtro por status e por responsável', async () => {
    const otherUser = await users.create(
      User.create({
        name: 'Outro Responsável',
        email: 'outro@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );

    await createProduct();
    await createProduct({
      code: 'NH3-01',
      unNumber: '1005',
      status: 'ACTIVE',
      responsibleUserId: otherUser.id,
    });

    const all = await request(app.getHttpServer())
      .get('/chemical-products')
      .expect(200);
    expect(all.body).toMatchObject({ total: 2, page: 1, pageSize: 20 });

    const active = await request(app.getHttpServer())
      .get('/chemical-products')
      .query({ status: 'ACTIVE' })
      .expect(200);
    expect(active.body.total).toBe(1);
    expect(active.body.items[0].code).toBe('NH3-01');

    const byUser = await request(app.getHttpServer())
      .get('/chemical-products')
      .query({ responsibleUserId: otherUser.id })
      .expect(200);
    expect(byUser.body.total).toBe(1);
    expect(byUser.body.items[0].responsibleUserId).toBe(otherUser.id);
  });

  it('atualiza os dados cadastrais de um produto, incluindo o responsável', async () => {
    const created = await createProduct();
    const otherUser = await users.create(
      User.create({
        name: 'Outro Responsável',
        email: 'outro@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/chemical-products/${created.id}`)
      .send({
        technicalName: 'Ácido sulfúrico concentrado',
        tradeName: null,
        unNumber: '1831',
        responsibleUserId: otherUser.id,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.technicalName).toBe('Ácido sulfúrico concentrado');
        expect(body.tradeName).toBeNull();
        expect(body.unNumber).toBe('1831');
        expect(body.responsibleUserId).toBe(otherUser.id);
      });

    await request(app.getHttpServer())
      .patch(`/chemical-products/${created.id}`)
      .send({ responsibleUserId: 'user-inexistente' })
      .expect(404);
  });

  it('não aceita alterar o status pelo endpoint de atualização cadastral', async () => {
    const created = await createProduct();

    await request(app.getHttpServer())
      .patch(`/chemical-products/${created.id}`)
      .send({ status: 'ACTIVE' })
      .expect(400);
  });

  it('ativa, inativa e bloqueia o produto por endpoints de ação', async () => {
    const created = await createProduct();

    const actions: Array<[string, string]> = [
      ['activate', 'ACTIVE'],
      ['deactivate', 'INACTIVE'],
      ['block', 'BLOCKED'],
      ['activate', 'ACTIVE'],
    ];

    for (const [action, status] of actions) {
      await request(app.getHttpServer())
        .post(`/chemical-products/${created.id}/${action}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe(status);
        });
    }

    await request(app.getHttpServer())
      .post('/chemical-products/id-inexistente/block')
      .expect(404);
  });

  it('altera o status do produto via PATCH /:id/status e rejeita status inválido', async () => {
    const created = await createProduct();

    for (const status of ['ACTIVE', 'INACTIVE', 'BLOCKED', 'ACTIVE']) {
      await request(app.getHttpServer())
        .patch(`/chemical-products/${created.id}/status`)
        .send({ status })
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe(status);
        });
    }

    await request(app.getHttpServer())
      .patch(`/chemical-products/${created.id}/status`)
      .send({ status: 'UNDER_ANALYSIS' })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/chemical-products/id-inexistente/status')
      .send({ status: 'ACTIVE' })
      .expect(404);
  });

  it('vincula e desvincula documentos do produto', async () => {
    const created = await createProduct();

    const withDocument = await request(app.getHttpServer())
      .post(`/chemical-products/${created.id}/documents`)
      .send(validDocument)
      .expect(201);

    expect(withDocument.body.documents).toHaveLength(1);
    const documentId = withDocument.body.documents[0].id as string;

    await request(app.getHttpServer())
      .delete(`/chemical-products/${created.id}/documents/${documentId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.documents).toHaveLength(0);
      });

    await request(app.getHttpServer())
      .delete(`/chemical-products/${created.id}/documents/${documentId}`)
      .expect(404);
  });

  it('exclui logicamente um produto, reserva o código e permite restaurá-lo', async () => {
    const created = await createProduct();

    await request(app.getHttpServer())
      .delete(`/chemical-products/${created.id}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/chemical-products/${created.id}`)
      .expect(404);

    const list = await request(app.getHttpServer())
      .get('/chemical-products')
      .expect(200);
    expect(list.body.total).toBe(0);

    await request(app.getHttpServer())
      .post('/chemical-products')
      .send({ ...validProduct, responsibleUserId: responsibleUser.id })
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toContain('excluído');
      });

    await request(app.getHttpServer())
      .post(`/chemical-products/${created.id}/restore`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.deletedAt).toBeNull();
        expect(body.code).toBe('H2SO4-98');
      });

    await request(app.getHttpServer())
      .get(`/chemical-products/${created.id}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/chemical-products/${created.id}/restore`)
      .expect(422);
  });

  it('retorna 404 ao remover um produto inexistente', async () => {
    await request(app.getHttpServer())
      .delete('/chemical-products/id-inexistente')
      .expect(404);
  });
});
