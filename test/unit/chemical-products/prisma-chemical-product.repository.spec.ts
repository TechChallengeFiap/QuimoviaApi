import { jest } from '@jest/globals';
import { PrismaChemicalProductRepository } from '@/modules/chemical-products/infrastructure/persistence/prisma/prisma-chemical-product.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';

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
