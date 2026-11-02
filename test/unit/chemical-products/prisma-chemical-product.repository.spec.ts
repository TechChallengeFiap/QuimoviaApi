import { jest } from '@jest/globals';
import { PrismaChemicalProductRepository } from '@/modules/chemical-products/infrastructure/persistence/prisma/prisma-chemical-product.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';

type PrismaMethod = (args: unknown) => Promise<unknown>;

function createPrismaFake() {
  return {
    chemicalProduct: {
      create: jest.fn<PrismaMethod>(),
      update: jest.fn<PrismaMethod>(),
      findFirst: jest.fn<PrismaMethod>(),
      findMany: jest.fn<PrismaMethod>(),
      count: jest.fn<PrismaMethod>(),
    },
  };
}

describe('PrismaChemicalProductRepository', () => {
  let prisma: ReturnType<typeof createPrismaFake>;
  let repository: PrismaChemicalProductRepository;

  beforeEach(() => {
    prisma = createPrismaFake();
    repository = new PrismaChemicalProductRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('persists a document revision through the existing aggregate without changing document identity', async () => {
    const product = ChemicalProduct.create({
      code: 'PRODUCT-01',
      technicalName: 'Ácido sulfúrico',
      unNumber: '1830',
      riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
      physicalState: ProductPhysicalState.LIQUID,
      responsibleUserId: 'user-reference',
    });
    const first = product.addDocument({
      type: ProductDocumentType.SAFETY_DATA_SHEET,
      number: 'FIRST',
      filePath: 'documents/first.pdf',
    });
    const second = product.addDocument({
      type: ProductDocumentType.CERTIFICATE,
      number: 'SECOND',
      filePath: 'documents/second.pdf',
    });
    product.updateDocument(first.id, { number: 'REVISED', expiresAt: null });
    prisma.chemicalProduct.update.mockResolvedValue({
      ...product.toObject(),
      documents: product.documents.map((document) => document.toObject()),
    });
    const persisted = await repository.update(product);
    expect(persisted.findDocument(first.id)?.toObject()).toEqual({
      ...first.toObject(),
      number: 'REVISED',
    });
    expect(persisted.findDocument(second.id)?.toObject()).toEqual(
      second.toObject(),
    );
    expect(prisma.chemicalProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: product.id },
        data: expect.objectContaining({
          documents: {
            deleteMany: { id: { notIn: [first.id, second.id] } },
            upsert: [
              expect.objectContaining({
                where: { id: first.id },
                update: expect.objectContaining({
                  id: first.id,
                  number: 'REVISED',
                  createdAt: first.createdAt,
                }),
              }),
              expect.objectContaining({ where: { id: second.id } }),
            ],
          },
        }),
      }),
    );
  });

  describe('exclusão lógica', () => {
    it('as buscas ignoram produtos excluídos por padrão', async () => {
      prisma.chemicalProduct.findFirst.mockResolvedValueOnce(null);

      await expect(repository.findById('prod-001')).resolves.toBeNull();
      expect(prisma.chemicalProduct.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod-001', deletedAt: null } }),
      );
    });

    it('includeDeleted remove o filtro de deletedAt da busca por código', async () => {
      prisma.chemicalProduct.findFirst.mockResolvedValueOnce(null);

      await repository.findByCode('PRODUCT-01', { includeDeleted: true });

      expect(prisma.chemicalProduct.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'PRODUCT-01' } }),
      );
    });

    it('a listagem só considera produtos não excluídos', async () => {
      prisma.chemicalProduct.findMany.mockResolvedValueOnce([]);
      prisma.chemicalProduct.count.mockResolvedValueOnce(0);

      await repository.list({ page: 1, pageSize: 20 });

      expect(prisma.chemicalProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
      expect(prisma.chemicalProduct.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ deletedAt: null }),
      });
    });

    it('a exclusão lógica é persistida pelo update, com deletedAt preenchido', async () => {
      const product = ChemicalProduct.create({
        code: 'PRODUCT-02',
        technicalName: 'Amônia anidra',
        unNumber: '1005',
        riskClass: ProductRiskClass.GASES,
        physicalState: ProductPhysicalState.GASEOUS,
        responsibleUserId: 'user-reference',
      });
      const at = new Date('2026-10-28T12:00:00Z');
      product.markAsDeleted(at);
      prisma.chemicalProduct.update.mockResolvedValueOnce({ ...product.toObject(), documents: [] });

      const persisted = await repository.update(product);

      expect(prisma.chemicalProduct.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: at }) }),
      );
      expect(persisted.deletedAt).toEqual(at);
      expect(persisted.isDeleted()).toBe(true);
    });
  });
});
