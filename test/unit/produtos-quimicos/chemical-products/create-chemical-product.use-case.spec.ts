import { CreateChemicalProductUseCase } from '@/modules/produtos-quimicos/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { ProductDocumentType } from '@/modules/produtos-quimicos/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/produtos-quimicos/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/produtos-quimicos/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/produtos-quimicos/domain/enums/product-status.enum.js';
import { BusinessRuleError, ConflictError } from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

describe('CreateChemicalProductUseCase', () => {
  let products: ChemicalProductRepositoryMock;
  let useCase: CreateChemicalProductUseCase;

  const input = {
    code: 'H2SO4-98',
    technicalName: 'Ácido sulfúrico',
    unNumber: '1830',
    riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
    physicalState: ProductPhysicalState.LIQUID,
  };

  beforeEach(() => {
    products = new ChemicalProductRepositoryMock();
    useCase = new CreateChemicalProductUseCase(products);
  });

  it('cria um produto em análise e o persiste', async () => {
    const product = await useCase.execute(input);

    expect(product.status).toBe(ProductStatus.UNDER_ANALYSIS);
    expect(await products.findById(product.id)).not.toBeNull();
  });

  it('cria o produto com os documentos informados', async () => {
    const product = await useCase.execute({
      ...input,
      documents: [
        {
          type: ProductDocumentType.CERTIFICATE,
          number: 'CERT-01',
          filePath: 'docs/cert.pdf',
          expiresAt: new Date('2027-01-01T00:00:00Z'),
        },
      ],
    });

    expect(product.documents).toHaveLength(1);
    expect(product.documents[0]?.number).toBe('CERT-01');
  });

  it('rejeita código já cadastrado, ignorando diferenças de caixa', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, code: 'h2so4-98', technicalName: 'Outro nome' }),
    ).rejects.toThrow(ConflictError);
  });

  it('propaga as invariantes do domínio', async () => {
    await expect(useCase.execute({ ...input, unNumber: '12' })).rejects.toThrow(
      BusinessRuleError,
    );
  });
});
