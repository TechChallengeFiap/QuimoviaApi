import { AddProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { ListProductDocumentsUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/list-product-documents.use-case.js';
import { FindProductDocumentByIdUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/find-product-document-by-id.use-case.js';
import { UpdateProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-product-document.use-case.js';
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
  let listDocuments: ListProductDocumentsUseCase;
  let findDocument: FindProductDocumentByIdUseCase;
  let updateDocument: UpdateProductDocumentUseCase;

  beforeEach(() => {
    products = new ChemicalProductRepositoryMock();
    addDocument = new AddProductDocumentUseCase(products);
    removeDocument = new RemoveProductDocumentUseCase(products);
    listDocuments = new ListProductDocumentsUseCase(products);
    findDocument = new FindProductDocumentByIdUseCase(products);
    updateDocument = new UpdateProductDocumentUseCase(products);
  });

  async function registerProduct(): Promise<ChemicalProduct> {
    return products.create(
      ChemicalProduct.create({
        code: 'CL2-01',
        technicalName: 'Cloro',
        unNumber: '1017',
        riskClass: ProductRiskClass.GASES,
        physicalState: ProductPhysicalState.GASEOUS,
        responsibleUserId: 'user-001',
      }),
    );
  }

  it('lists documents and reads an individual document within its product', async () => {
    const product = await registerProduct();
    expect(await listDocuments.execute(product.id)).toEqual([]);
    const updated = await addDocument.execute(product.id, documentInput);
    const document = updated.documents[0];
    expect(await listDocuments.execute(product.id)).toEqual([document]);
    expect(await findDocument.execute(product.id, document.id)).toBe(document);
  });

  it('returns not found for missing products in reads and updates', async () => {
    await expect(listDocuments.execute('missing-product')).rejects.toThrow(
      ResourceNotFoundError,
    );
    await expect(
      findDocument.execute('missing-product', 'document'),
    ).rejects.toThrow(ResourceNotFoundError);
    await expect(
      updateDocument.execute('missing-product', 'document', {
        number: 'UPDATED',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('does not read or update documents belonging to a different product', async () => {
    const first = await registerProduct();
    const second = await registerProduct();
    const updated = await addDocument.execute(first.id, documentInput);
    const documentId = updated.documents[0].id;
    await expect(findDocument.execute(second.id, documentId)).rejects.toThrow(
      ResourceNotFoundError,
    );
    await expect(
      updateDocument.execute(second.id, documentId, { number: 'UPDATED' }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect((await findDocument.execute(first.id, documentId)).number).toBe(
      documentInput.number,
    );
  });

  it('updates only the selected document and preserves its identity and product data', async () => {
    const product = await registerProduct();
    await addDocument.execute(product.id, {
      ...documentInput,
      expiresAt: new Date('2028-01-01'),
    });
    const updated = await addDocument.execute(product.id, {
      ...documentInput,
      number: 'SECOND',
    });
    const [first, second] = updated.documents;
    const document = await updateDocument.execute(product.id, first.id, {
      number: ' UPDATED ',
      type: ProductDocumentType.CERTIFICATE,
      filePath: 'documents/updated.pdf',
      expiresAt: null,
    });
    expect(document).toMatchObject({
      id: first.id,
      createdAt: first.createdAt,
      number: 'UPDATED',
      type: ProductDocumentType.CERTIFICATE,
      expiresAt: null,
      filePath: 'documents/updated.pdf',
    });
    expect(
      (await findDocument.execute(product.id, second.id)).toObject(),
    ).toEqual(second.toObject());
    const persisted = await products.findById(product.id);
    expect(persisted?.status).toBe(product.status);
    expect(persisted?.responsibleUserId).toBe(product.responsibleUserId);
  });

  it.each([
    { number: ' ' },
    { number: 'x'.repeat(81) },
    { filePath: ' ' },
    { filePath: 'x'.repeat(501) },
    { expiresAt: new Date('invalid') },
    { type: 'INVALID' as ProductDocumentType },
  ])('rejects an invalid revision atomically: %j', async (changes) => {
    const product = await registerProduct();
    const updated = await addDocument.execute(product.id, documentInput);
    const document = updated.documents[0];
    const before = updated.toObject();
    await expect(
      updateDocument.execute(product.id, document.id, changes),
    ).rejects.toThrow(BusinessRuleError);
    expect((await products.findById(product.id))?.toObject()).toEqual(before);
  });

  describe('AddProductDocumentUseCase', () => {
    it('lança erro quando o produto não existe', async () => {
      await expect(
        addDocument.execute('id-inexistente', documentInput),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('vincula o documento ao produto e persiste o agregado', async () => {
      const product = await registerProduct();

      const updated = await addDocument.execute(product.id, {
        ...documentInput,
        expiresAt: new Date('2028-06-30T00:00:00Z'),
      });

      expect(updated.documents).toHaveLength(1);
      expect(updated.documents[0]?.expiresAt).toEqual(
        new Date('2028-06-30T00:00:00Z'),
      );
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
      await expect(
        removeDocument.execute('id-inexistente', 'doc'),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('lança erro quando o documento não pertence ao produto', async () => {
      const product = await registerProduct();

      await expect(
        removeDocument.execute(product.id, 'doc-inexistente'),
      ).rejects.toThrow(ResourceNotFoundError);
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
