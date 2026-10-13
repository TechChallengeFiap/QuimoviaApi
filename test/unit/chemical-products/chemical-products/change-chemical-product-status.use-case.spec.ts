import { ChangeChemicalProductStatusUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/change-chemical-product-status.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

describe('ChangeChemicalProductStatusUseCase', () => {
  let products: ChemicalProductRepositoryMock;
  let useCase: ChangeChemicalProductStatusUseCase;

  beforeEach(() => {
    products = new ChemicalProductRepositoryMock();
    useCase = new ChangeChemicalProductStatusUseCase(products);
  });

  async function registerProduct(): Promise<ChemicalProduct> {
    return products.create(
      ChemicalProduct.create({
        code: 'NH3-01',
        technicalName: 'Amônia anidra',
        unNumber: '1005',
        riskClass: ProductRiskClass.GASES,
        physicalState: ProductPhysicalState.GASEOUS,
        responsibleUserId: 'user-001',
      }),
    );
  }

  it('lança erro quando o produto não existe', async () => {
    await expect(useCase.execute('id-inexistente', ProductStatus.ACTIVE)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('ativa, inativa e bloqueia o produto', async () => {
    const product = await registerProduct();

    expect((await useCase.execute(product.id, ProductStatus.ACTIVE)).status).toBe(
      ProductStatus.ACTIVE,
    );
    expect((await useCase.execute(product.id, ProductStatus.INACTIVE)).status).toBe(
      ProductStatus.INACTIVE,
    );
    expect((await useCase.execute(product.id, ProductStatus.BLOCKED)).status).toBe(
      ProductStatus.BLOCKED,
    );
  });

  it('não permite devolver um produto ao status EM ANÁLISE', async () => {
    const product = await registerProduct();
    await useCase.execute(product.id, ProductStatus.ACTIVE);

    await expect(useCase.execute(product.id, ProductStatus.UNDER_ANALYSIS)).rejects.toThrow(
      BusinessRuleError,
    );
  });

  it('é idempotente quando o status já é o solicitado', async () => {
    const product = await registerProduct();
    const before = product.updatedAt;

    const result = await useCase.execute(product.id, ProductStatus.UNDER_ANALYSIS);

    expect(result.status).toBe(ProductStatus.UNDER_ANALYSIS);
    expect(result.updatedAt).toEqual(before);
  });
});
