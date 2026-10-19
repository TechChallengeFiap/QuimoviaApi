import { DeleteChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ConflictError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

describe('DeleteChemicalProductUseCase', () => {
  it('lança erro quando o produto não existe', async () => {
    const useCase = new DeleteChemicalProductUseCase(new ChemicalProductRepositoryMock());

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
  });

  it('remove um produto existente', async () => {
    const products = new ChemicalProductRepositoryMock();
    const product = await products.create(
      ChemicalProduct.create({
        code: 'NACL-01',
        technicalName: 'Cloreto de sódio',
        unNumber: '9999',
        riskClass: ProductRiskClass.MISCELLANEOUS_DANGEROUS_SUBSTANCES,
        physicalState: ProductPhysicalState.SOLID,
        responsibleUserId: 'user-001',
      }),
    );

    const useCase = new DeleteChemicalProductUseCase(products);
    await useCase.execute(product.id);

    await expect(products.findById(product.id)).resolves.toBeNull();
  });

  it('propaga ConflictError quando a remoção falha por violação de integridade referencial', async () => {
    const products = new ChemicalProductRepositoryMock();
    const product = await products.create(
      ChemicalProduct.create({
        code: 'NACL-01',
        technicalName: 'Cloreto de sódio',
        unNumber: '9999',
        riskClass: ProductRiskClass.MISCELLANEOUS_DANGEROUS_SUBSTANCES,
        physicalState: ProductPhysicalState.SOLID,
        responsibleUserId: 'user-001',
      }),
    );

    products.remove = async () => {
      throw new ConflictError(
        'Não é possível excluir o produto químico porque existem registros associados a ele.',
      );
    };

    const useCase = new DeleteChemicalProductUseCase(products);
    await expect(useCase.execute(product.id)).rejects.toThrow(ConflictError);
  });
});
