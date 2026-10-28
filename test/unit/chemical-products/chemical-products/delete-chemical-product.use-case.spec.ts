import { DeleteChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { RestoreChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/restore-chemical-product.use-case.js';
import { CreateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';
import { LotRepositoryMock } from '../../../mocks/lot-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('Exclusão lógica e restauração do produto químico', () => {
  let products: ChemicalProductRepositoryMock;
  let lots: LotRepositoryMock;
  let users: UserRepositoryMock;
  let responsibleUser: User;
  let deleteProduct: DeleteChemicalProductUseCase;
  let restoreProduct: RestoreChemicalProductUseCase;

  beforeEach(async () => {
    products = new ChemicalProductRepositoryMock();
    lots = new LotRepositoryMock();
    users = new UserRepositoryMock();
    responsibleUser = await users.create(
      User.create({
        name: 'Responsável Técnico',
        email: 'tecnico@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
    deleteProduct = new DeleteChemicalProductUseCase(products, lots);
    restoreProduct = new RestoreChemicalProductUseCase(products);
  });

  function productData() {
    return {
      code: 'NACL-01',
      technicalName: 'Cloreto de sódio',
      unNumber: '9999',
      riskClass: ProductRiskClass.MISCELLANEOUS_DANGEROUS_SUBSTANCES,
      physicalState: ProductPhysicalState.SOLID,
      responsibleUserId: responsibleUser.id,
    };
  }

  async function registerProduct(): Promise<ChemicalProduct> {
    return products.create(ChemicalProduct.create(productData()));
  }

  it('lança erro quando o produto não existe', async () => {
    await expect(deleteProduct.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
    await expect(restoreProduct.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
  });

  it('marca o produto como excluído em vez de apagá-lo, e ele some das buscas', async () => {
    const product = await registerProduct();

    await deleteProduct.execute(product.id);

    await expect(products.findById(product.id)).resolves.toBeNull();
    await expect(products.findByCode('NACL-01')).resolves.toBeNull();
    expect((await products.list({ page: 1, pageSize: 20 })).total).toBe(0);

    const kept = await products.findById(product.id, { includeDeleted: true });
    expect(kept?.isDeleted()).toBe(true);
    expect(kept?.deletedAt).toBeInstanceOf(Date);
  });

  it('um produto excluído não pode ser excluído de novo pela rota normal', async () => {
    const product = await registerProduct();
    await deleteProduct.execute(product.id);

    await expect(deleteProduct.execute(product.id)).rejects.toThrow(ResourceNotFoundError);
  });

  it('não exclui um produto com lotes em aberto, mas permite com lotes finalizados', async () => {
    const product = await registerProduct();
    const lot = Lot.create({ chemicalProductId: product.id, lotNumber: 'L1', quantity: 10 });
    await lots.create(lot);

    await expect(deleteProduct.execute(product.id)).rejects.toThrow(BusinessRuleError);
    expect((await products.findById(product.id))?.isDeleted()).toBe(false);

    lot.expire();
    lot.dispose();
    await lots.update(lot);

    await deleteProduct.execute(product.id);
    await expect(products.findById(product.id)).resolves.toBeNull();
  });

  it('restaura um produto excluído e rejeita restaurar um produto ativo', async () => {
    const product = await registerProduct();
    await deleteProduct.execute(product.id);

    const restored = await restoreProduct.execute(product.id);

    expect(restored.isDeleted()).toBe(false);
    expect(restored.deletedAt).toBeNull();
    await expect(products.findById(product.id)).resolves.not.toBeNull();

    await expect(restoreProduct.execute(product.id)).rejects.toThrow(BusinessRuleError);
  });

  it('o código de um produto excluído continua reservado', async () => {
    const product = await registerProduct();
    await deleteProduct.execute(product.id);
    const createProduct = new CreateChemicalProductUseCase(products, users);

    await expect(createProduct.execute(productData())).rejects.toThrow(ConflictError);
    await expect(createProduct.execute(productData())).rejects.toThrow(/excluído/);
  });
});
