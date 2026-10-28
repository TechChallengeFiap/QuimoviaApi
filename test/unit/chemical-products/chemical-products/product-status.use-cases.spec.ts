import { ActivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/activate-chemical-product.use-case.js';
import { BlockChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/block-chemical-product.use-case.js';
import { DeactivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/deactivate-chemical-product.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

describe('Ações de status do produto químico', () => {
  let products: ChemicalProductRepositoryMock;
  let activate: ActivateChemicalProductUseCase;
  let deactivate: DeactivateChemicalProductUseCase;
  let block: BlockChemicalProductUseCase;

  beforeEach(() => {
    products = new ChemicalProductRepositoryMock();
    activate = new ActivateChemicalProductUseCase(products);
    deactivate = new DeactivateChemicalProductUseCase(products);
    block = new BlockChemicalProductUseCase(products);
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

  it('lançam erro quando o produto não existe', async () => {
    await expect(activate.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
    await expect(deactivate.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
    await expect(block.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
  });

  it('ativa, inativa e bloqueia o produto, persistindo cada mudança', async () => {
    const product = await registerProduct();

    expect((await activate.execute(product.id)).status).toBe(ProductStatus.ACTIVE);
    expect((await products.findById(product.id))?.status).toBe(ProductStatus.ACTIVE);

    expect((await deactivate.execute(product.id)).status).toBe(ProductStatus.INACTIVE);
    expect((await block.execute(product.id)).status).toBe(ProductStatus.BLOCKED);
  });

  it('é idempotente quando o produto já está no status pedido', async () => {
    const product = await registerProduct();
    await activate.execute(product.id);
    const before = (await products.findById(product.id))!.updatedAt;

    const result = await activate.execute(product.id);

    expect(result.status).toBe(ProductStatus.ACTIVE);
    expect(result.updatedAt).toEqual(before);
  });
});
