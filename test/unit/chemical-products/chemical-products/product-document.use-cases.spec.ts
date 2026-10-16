import { AddProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';

const documentInput = {
  type: ProductDocumentType.ENVIRONMENTAL_LICENSE,
  number: 'LIC-2026-01',
  filePath: 'docs/licenca.pdf',
};

describe('Documentos do produto químico', () => {
  let products: ChemicalProductRepositoryMock;
  let addDocument: AddProductDocumentUseCase;
  let removeDocument: RemoveProductDocumentUseCase;

  beforeEach(() => {
    products = new ChemicalProductRepositoryMock();
    addDocument = new AddProductDocumentUseCase(products);
    removeDocument = new RemoveProductDocumentUseCase(products);
  });

  async function registerProduct(): Promise<ChemicalProduct> {
    return products.create(
      ChemicalProduct.create({
        code: 'CL2-01',
        technicalName: 'Cloro',
        unNumber: '1017',
        riskClass: ProductRiskClass.GASES,
        physicalState: ProductPhysicalState.GASEOUS,
      }),
    );
  }

  describe('AddProductDocumentUseCase', () => {
    it('lança erro quando o produto não existe', async () => {
      await expect(addDocument.execute('id-inexistente', documentInput)).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('vincula o documento ao produto e persiste o agregado', async () => {
      const product = await registerProduct();

      const updated = await addDocument.execute(product.id, {
        ...documentInput,
        expiresAt: new Date('2028-06-30T00:00:00Z'),
      });

      expect(updated.documents).toHaveLength(1);
      expect(updated.documents[0]?.expiresAt).toEqual(new Date('2028-06-30T00:00:00Z'));
      expect((await products.findById(product.id))?.documents).toHaveLength(1);
    });

    it('propaga as invariantes do documento', async () => {
      const product = await registerProduct();

      await expect(
        addDocument.execute(product.id, { ...documentInput, number: '' }),
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('RemoveProductDocumentUseCase', () => {
    it('lança erro quando o produto não existe', async () => {
      await expect(removeDocument.execute('id-inexistente', 'doc')).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('lança erro quando o documento não pertence ao produto', async () => {
      const product = await registerProduct();

      await expect(removeDocument.execute(product.id, 'doc-inexistente')).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('desvincula o documento do produto', async () => {
      const product = await registerProduct();
      const withDocument = await addDocument.execute(product.id, documentInput);
      const documentId = withDocument.documents[0]!.id;

      const updated = await removeDocument.execute(product.id, documentId);

      expect(updated.documents).toHaveLength(0);
    });
  });
});
