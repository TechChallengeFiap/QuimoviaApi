import { jest } from '@jest/globals';
import { PrismaChemicalProductRepository } from '@/modules/chemical-products/infrastructure/persistence/prisma/prisma-chemical-product.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
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
      delete: jest.fn<PrismaMethod>(),
      findUnique: jest.fn<PrismaMethod>(),
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

  describe('remove', () => {
    it('remove o produto químico com sucesso', async () => {
      prisma.chemicalProduct.delete.mockResolvedValueOnce({ id: 'prod-001' });

      await expect(repository.remove('prod-001')).resolves.toBeUndefined();
      expect(prisma.chemicalProduct.delete).toHaveBeenCalledWith({
        where: { id: 'prod-001' },
      });
    });

    it('converte erro P2003 (violação de chave estrangeira) em ConflictError', async () => {
      const p2003Error = Object.assign(
        new Error('Foreign key constraint failed on the field: `productId`'),
        { code: 'P2003' },
      );
      prisma.chemicalProduct.delete.mockRejectedValue(p2003Error);

      await expect(repository.remove('prod-001')).rejects.toThrow(
        ConflictError,
      );
      await expect(repository.remove('prod-001')).rejects.toThrow(
        'Não é possível excluir o produto químico porque existem registros associados a ele.',
      );
    });

    it('repassa outros erros inesperados sem mascarar', async () => {
      const unexpectedError = new Error('Database connection failed');
      prisma.chemicalProduct.delete.mockRejectedValueOnce(unexpectedError);

      await expect(repository.remove('prod-001')).rejects.toThrow(
        unexpectedError,
      );
    });
  });
});
