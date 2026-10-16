import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

function createValidProduct(
  override: Partial<Parameters<typeof ChemicalProduct.create>[0]> = {},
) {
  return ChemicalProduct.create({
    code: 'h2so4-98',
    technicalName: 'Ácido sulfúrico',
    tradeName: 'Sulfurax 98',
    unNumber: '1830',
    riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
    physicalState: ProductPhysicalState.LIQUID,
    ...override,
  });
}

const validDocument = {
  type: ProductDocumentType.SAFETY_DATA_SHEET,
  number: 'FISPQ-001',
  filePath: 'docs/fispq.pdf',
};

describe('ChemicalProduct', () => {
  it('cria um produto em análise por padrão, com o código normalizado em maiúsculas', () => {
    const product = createValidProduct();

    expect(product.status).toBe(ProductStatus.UNDER_ANALYSIS);
    expect(product.code).toBe('H2SO4-98');
    expect(product.documents).toEqual([]);
    expect(product.id).toEqual(expect.any(String));
  });

  it('aceita um status inicial explícito', () => {
    const product = createValidProduct({ status: ProductStatus.ACTIVE });

    expect(product.status).toBe(ProductStatus.ACTIVE);
  });

  it('trata nome comercial vazio como ausente', () => {
    expect(createValidProduct({ tradeName: '   ' }).tradeName).toBeNull();
    expect(createValidProduct({ tradeName: undefined }).tradeName).toBeNull();
  });

  it('rejeita código vazio ou com caracteres inválidos', () => {
    expect(() => createValidProduct({ code: '  ' })).toThrow(BusinessRuleError);
    expect(() => createValidProduct({ code: 'H2 SO4' })).toThrow(BusinessRuleError);
  });

  it('rejeita nome técnico menor que 3 caracteres', () => {
    expect(() => createValidProduct({ technicalName: 'Ab' })).toThrow(BusinessRuleError);
  });

  it('rejeita número ONU que não tenha exatamente 4 dígitos', () => {
    expect(() => createValidProduct({ unNumber: '183' })).toThrow(BusinessRuleError);
    expect(() => createValidProduct({ unNumber: '18300' })).toThrow(BusinessRuleError);
    expect(() => createValidProduct({ unNumber: 'ABCD' })).toThrow(BusinessRuleError);
  });

  it('só pode ser usado em operações quando está ativo', () => {
    const product = createValidProduct();

    expect(product.canBeUsedInOperations()).toBe(false);

    product.activate();
    expect(product.canBeUsedInOperations()).toBe(true);

    product.block();
    expect(product.status).toBe(ProductStatus.BLOCKED);
    expect(product.canBeUsedInOperations()).toBe(false);

    product.deactivate();
    expect(product.status).toBe(ProductStatus.INACTIVE);
  });

  it('cria documentos informados no cadastro', () => {
    const product = createValidProduct({ documents: [validDocument] });

    expect(product.documents).toHaveLength(1);
    expect(product.documents[0]?.type).toBe(ProductDocumentType.SAFETY_DATA_SHEET);
    expect(product.documents[0]?.expiresAt).toBeNull();
  });

  it('adiciona e remove documentos apenas por meio do agregado', () => {
    const product = createValidProduct();
    const document = product.addDocument({
      ...validDocument,
      expiresAt: new Date('2027-12-31T00:00:00Z'),
    });

    expect(product.findDocument(document.id)).toBe(document);
    expect(product.documents).toHaveLength(1);

    // A lista exposta é uma cópia: alterá-la não afeta o agregado.
    product.documents.pop();
    expect(product.documents).toHaveLength(1);

    product.removeDocument(document.id);
    expect(product.documents).toHaveLength(0);
    expect(product.findDocument(document.id)).toBeNull();
  });

  it('lança erro ao remover um documento inexistente', () => {
    const product = createValidProduct();

    expect(() => product.removeDocument('doc-inexistente')).toThrow(ResourceNotFoundError);
  });

  it('rejeita documento sem número ou sem caminho de arquivo', () => {
    const product = createValidProduct();

    expect(() => product.addDocument({ ...validDocument, number: ' ' })).toThrow(
      BusinessRuleError,
    );
    expect(() => product.addDocument({ ...validDocument, filePath: '' })).toThrow(
      BusinessRuleError,
    );
  });

  it('informa se um documento está expirado', () => {
    const product = createValidProduct();
    const expired = product.addDocument({
      ...validDocument,
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    });
    const valid = product.addDocument({ ...validDocument, number: 'FISPQ-002' });

    expect(expired.isExpired(new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(valid.isExpired()).toBe(false);
  });
});
