import { CreateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';

describe('CreateChemicalProductUseCase', () => {
  let products: ChemicalProductRepositoryMock;
  let users: UserRepositoryMock;
  let useCase: CreateChemicalProductUseCase;
  let responsibleUser: User;

  const baseInput = {
    code: 'H2SO4-98',
    technicalName: 'Ácido sulfúrico',
    unNumber: '1830',
    riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
    physicalState: ProductPhysicalState.LIQUID,
  };

  beforeEach(async () => {
    products = new ChemicalProductRepositoryMock();
    users = new UserRepositoryMock();
    useCase = new CreateChemicalProductUseCase(products, users);

    responsibleUser = await users.create(
      User.create({
        name: 'Responsável Técnico',
        email: 'tecnico@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
  });

  function input(override: Record<string, unknown> = {}) {
    return { ...baseInput, responsibleUserId: responsibleUser.id, ...override };
  }

  it('cria um produto em análise, vinculado ao usuário responsável, e o persiste', async () => {
    const product = await useCase.execute(input());

    expect(product.status).toBe(ProductStatus.UNDER_ANALYSIS);
    expect(product.responsibleUserId).toBe(responsibleUser.id);
    expect(await products.findById(product.id)).not.toBeNull();
  });

  it('cria o produto com os documentos informados', async () => {
    const product = await useCase.execute(
      input({
        documents: [
          {
            type: ProductDocumentType.CERTIFICATE,
            number: 'CERT-01',
            filePath: 'docs/cert.pdf',
            expiresAt: new Date('2027-01-01T00:00:00Z'),
          },
        ],
      }),
    );

    expect(product.documents).toHaveLength(1);
    expect(product.documents[0]?.number).toBe('CERT-01');
  });

  it('rejeita código já cadastrado, ignorando diferenças de caixa', async () => {
    await useCase.execute(input());

    await expect(
      useCase.execute(input({ code: 'h2so4-98', technicalName: 'Outro nome' })),
    ).rejects.toThrow(ConflictError);
  });

  it('rejeita usuário responsável inexistente', async () => {
    await expect(
      useCase.execute(input({ responsibleUserId: 'user-inexistente' })),
    ).rejects.toThrow(ResourceNotFoundError);

    await expect(products.findByCode('H2SO4-98')).resolves.toBeNull();
  });

  it('propaga as invariantes do domínio', async () => {
    await expect(useCase.execute(input({ unNumber: '12' }))).rejects.toThrow(
      BusinessRuleError,
    );
  });
});
