import { UpdateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('UpdateChemicalProductUseCase', () => {
  let products: ChemicalProductRepositoryMock;
  let users: UserRepositoryMock;
  let useCase: UpdateChemicalProductUseCase;
  let responsibleUser: User;

  beforeEach(async () => {
    products = new ChemicalProductRepositoryMock();
    users = new UserRepositoryMock();
    useCase = new UpdateChemicalProductUseCase(products, users);

    responsibleUser = await users.create(
      User.create({
        name: 'Responsável Técnico',
        email: 'tecnico@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
  });

  async function registerUser(email: string): Promise<User> {
    return users.create(
      User.create({
        name: 'Outro Responsável',
        email,
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
  }

  async function registerProduct(code = 'H2SO4-98'): Promise<ChemicalProduct> {
    return products.create(
      ChemicalProduct.create({
        code,
        technicalName: 'Ácido sulfúrico',
        tradeName: 'Sulfurax 98',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: responsibleUser.id,
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
    expect(updated.responsibleUserId).toBe(responsibleUser.id);
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

  it('troca o usuário responsável quando ele existe', async () => {
    const product = await registerProduct();
    const newUser = await registerUser('outro@quimovia.com');

    const updated = await useCase.execute(product.id, { responsibleUserId: newUser.id });

    expect(updated.responsibleUserId).toBe(newUser.id);
  });

  it('rejeita trocar para um usuário responsável inexistente', async () => {
    const product = await registerProduct();

    await expect(
      useCase.execute(product.id, { responsibleUserId: 'user-inexistente' }),
    ).rejects.toThrow(ResourceNotFoundError);

    expect((await products.findById(product.id))?.responsibleUserId).toBe(responsibleUser.id);
  });
});
