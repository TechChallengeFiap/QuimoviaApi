import { UpdateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

describe('UpdateChemicalProductUseCase', () => {
  let products: ChemicalProductRepositoryMock;
  let useCase: UpdateChemicalProductUseCase;

  beforeEach(() => {
    products = new ChemicalProductRepositoryMock();
    useCase = new UpdateChemicalProductUseCase(products);
  });

  async function registerProduct(code = 'H2SO4-98'): Promise<ChemicalProduct> {
    return products.create(
      ChemicalProduct.create({
        code,
        technicalName: 'Ácido sulfúrico',
        tradeName: 'Sulfurax 98',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
      }),
    );
  }

  it('lança erro quando o produto não existe', async () => {
    await expect(
      useCase.execute('id-inexistente', { technicalName: 'Novo nome' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('atualiza os dados cadastrais informados', async () => {
    const product = await registerProduct();

    const updated = await useCase.execute(product.id, {
      technicalName: 'Ácido sulfúrico concentrado',
      tradeName: null,
      unNumber: '1831',
      riskClass: ProductRiskClass.TOXIC_SUBSTANCES,
      physicalState: ProductPhysicalState.GASEOUS,
    });

    expect(updated.technicalName).toBe('Ácido sulfúrico concentrado');
    expect(updated.tradeName).toBeNull();
    expect(updated.unNumber).toBe('1831');
    expect(updated.riskClass).toBe(ProductRiskClass.TOXIC_SUBSTANCES);
    expect(updated.physicalState).toBe(ProductPhysicalState.GASEOUS);
    expect(updated.code).toBe('H2SO4-98');
  });

  it('permite reenviar o mesmo código sem gerar conflito', async () => {
    const product = await registerProduct();

    const updated = await useCase.execute(product.id, { code: 'h2so4-98' });

    expect(updated.code).toBe('H2SO4-98');
  });

  it('rejeita alterar para um código já usado por outro produto', async () => {
    await registerProduct('TAKEN-01');
    const product = await registerProduct('FREE-01');

    await expect(useCase.execute(product.id, { code: 'taken-01' })).rejects.toThrow(
      ConflictError,
    );
  });
});
