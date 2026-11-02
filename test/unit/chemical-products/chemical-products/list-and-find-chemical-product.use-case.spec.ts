import { FindChemicalProductByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-chemical-product-by-id.use-case.js';
import { ListChemicalProductsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-chemical-products.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

function buildProduct(code: string, override: Partial<Parameters<typeof ChemicalProduct.create>[0]> = {}) {
  return ChemicalProduct.create({
    code,
    technicalName: 'Produto de teste',
    unNumber: '1234',
    riskClass: ProductRiskClass.GASES,
    physicalState: ProductPhysicalState.GASEOUS,
    responsibleUserId: 'user-001',
    ...override,
  });
}

describe('FindChemicalProductByIdUseCase', () => {
  it('lança erro quando o produto não existe', async () => {
    const useCase = new FindChemicalProductByIdUseCase(new ChemicalProductRepositoryMock());

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
  });

  it('retorna o produto quando ele existe', async () => {
    const products = new ChemicalProductRepositoryMock();
    const product = await products.create(buildProduct('GAS-01'));

    const useCase = new FindChemicalProductByIdUseCase(products);

    await expect(useCase.execute(product.id)).resolves.toBe(product);
  });
});

describe('ListChemicalProductsUseCase', () => {
  it('aplica os valores padrão de paginação', async () => {
    const useCase = new ListChemicalProductsUseCase(new ChemicalProductRepositoryMock());

    const result = await useCase.execute();

    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('filtra por classe de risco, estado físico e status', async () => {
    const products = new ChemicalProductRepositoryMock();
    await products.create(buildProduct('GAS-01'));
    await products.create(
      buildProduct('LIQ-01', {
        riskClass: ProductRiskClass.FLAMMABLE_LIQUIDS,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: 'user-001',
        status: ProductStatus.ACTIVE,
      }),
    );

    const useCase = new ListChemicalProductsUseCase(products);

    const byRisk = await useCase.execute({ riskClass: ProductRiskClass.FLAMMABLE_LIQUIDS });
    expect(byRisk.items.map((product) => product.code)).toEqual(['LIQ-01']);

    const byState = await useCase.execute({ physicalState: ProductPhysicalState.GASEOUS });
    expect(byState.items.map((product) => product.code)).toEqual(['GAS-01']);

    const byStatus = await useCase.execute({ status: ProductStatus.ACTIVE });
    expect(byStatus.total).toBe(1);
  });

  it('filtra pelo usuário responsável', async () => {
    const products = new ChemicalProductRepositoryMock();
    await products.create(buildProduct('GAS-01'));
    await products.create(buildProduct('GAS-02', { responsibleUserId: 'user-002' }));

    const useCase = new ListChemicalProductsUseCase(products);
    const result = await useCase.execute({ responsibleUserId: 'user-002' });

    expect(result.items.map((product) => product.code)).toEqual(['GAS-02']);
  });
});
