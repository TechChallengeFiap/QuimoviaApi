import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import { CreateCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/create-cargo-document.use-case.js';
import { DeleteCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/delete-cargo-document.use-case.js';
import { FindCargoDocumentByIdUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/find-cargo-document-by-id.use-case.js';
import { ListCargoDocumentsUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/list-cargo-documents.use-case.js';
import { UpdateCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/update-cargo-document.use-case.js';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { CargoDocumentRepositoryMock } from '../../mocks/cargo-document-repository.mock.js';
import {
  createAttachmentData,
  createCargoDocumentData,
  SHIPPER_ID,
} from '../../mocks/cargo-document.fixture.js';

describe('Casos de uso de CargoDocument', () => {
  let documents: CargoDocumentRepositoryMock;
  let createDocument: CreateCargoDocumentUseCase;
  let findDocument: FindCargoDocumentByIdUseCase;
  let listDocuments: ListCargoDocumentsUseCase;
  let updateDocument: UpdateCargoDocumentUseCase;
  let deleteDocument: DeleteCargoDocumentUseCase;

  beforeEach(() => {
    documents = new CargoDocumentRepositoryMock();
    createDocument = new CreateCargoDocumentUseCase(documents);
    findDocument = new FindCargoDocumentByIdUseCase(documents);
    listDocuments = new ListCargoDocumentsUseCase(documents);
    updateDocument = new UpdateCargoDocumentUseCase(documents);
    deleteDocument = new DeleteCargoDocumentUseCase(documents);
  });

  describe('CreateCargoDocumentUseCase', () => {
    it('persiste a raiz e seus anexos e devolve o registro', async () => {
      const document = await createDocument.execute(createCargoDocumentData());
      expect((await documents.findById(document.id))?.toObject()).toEqual(
        document.toObject(),
      );
      expect(document.attachments).toHaveLength(1);
    });

    it('rejeita outra documentação para a mesma carga, inclusive em caixa diferente', async () => {
      const input = createCargoDocumentData();
      await createDocument.execute(input);
      await expect(
        createDocument.execute({
          ...input,
          cargoId: input.cargoId.toUpperCase(),
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('não consulta nem grava o repositório se o cadastro for inválido', async () => {
      const create = jest.spyOn(documents, 'create');
      const find = jest.spyOn(documents, 'findByCargoId');
      await expect(
        createDocument.execute(
          createCargoDocumentData({ compositionVersion: 0 }),
        ),
      ).rejects.toThrow(BusinessRuleError);
      expect(create).not.toHaveBeenCalled();
      expect(find).not.toHaveBeenCalled();
    });
  });

  describe('FindCargoDocumentByIdUseCase', () => {
    it('encontra pelo UUID sem distinguir caixa e rejeita inexistente', async () => {
      const document = await documents.create(
        CargoDocument.create(createCargoDocumentData()),
      );
      expect((await findDocument.execute(document.id.toUpperCase())).id).toBe(
        document.id,
      );
      await expect(findDocument.execute(randomUUID())).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });

  describe('ListCargoDocumentsUseCase', () => {
    it('aplica a paginação padrão, inclusive para resultado vazio', async () => {
      expect(await listDocuments.execute()).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
    });

    it('pagina sem repetir itens e combina filtros mantendo o total', async () => {
      const first = await documents.create(
        CargoDocument.create(createCargoDocumentData()),
      );
      await documents.create(CargoDocument.create(createCargoDocumentData()));
      await documents.create(
        CargoDocument.create(
          createCargoDocumentData({ shipperId: randomUUID() }),
        ),
      );
      const filters = {
        shipperId: SHIPPER_ID.toUpperCase(),
        status: CargoDocumentStatus.PENDING,
        pageSize: 1,
      };
      const page1 = await listDocuments.execute({ ...filters, page: 1 });
      const page2 = await listDocuments.execute({ ...filters, page: 2 });
      expect(page1.total).toBe(2);
      expect(page2.total).toBe(2);
      expect(page1.items[0].id).not.toBe(page2.items[0].id);
      expect(
        (
          await listDocuments.execute({
            ...filters,
            cargoId: first.cargoId.toUpperCase(),
          })
        ).total,
      ).toBe(1);
      expect(
        (await listDocuments.execute({ ...filters, page: 3 })).items,
      ).toEqual([]);
      expect(
        (
          await listDocuments.execute({
            status: CargoDocumentStatus.UNDER_REVIEW,
          })
        ).total,
      ).toBe(0);
    });

    it.each([
      { page: 0 },
      { page: 1.5 },
      { pageSize: 0 },
      { pageSize: 101 },
      { page: Number.MAX_SAFE_INTEGER, pageSize: 100 },
    ])('rejeita paginação inválida: %j', async (input) => {
      await expect(listDocuments.execute(input)).rejects.toThrow(
        BusinessRuleError,
      );
    });
  });

  describe('UpdateCargoDocumentUseCase', () => {
    it('atualiza anexos preservando vínculos, datas e histórico', async () => {
      const original = await documents.create(
        CargoDocument.create(createCargoDocumentData()),
      );
      const updated = await updateDocument.execute(original.id, {
        attachments: [
          createAttachmentData({
            replacesAttachmentId: original.attachments[0].id,
          }),
        ],
      });
      expect(updated.toObject()).toMatchObject({
        id: original.id,
        cargoId: original.cargoId,
        shipperId: original.shipperId,
        createdAt: original.createdAt,
        revision: 1,
      });
      expect(updated.attachments).toHaveLength(2);
      expect(
        (await documents.findById(original.id))?.attachments[0].removedAt,
      ).not.toBeNull();
    });

    it('retorna erro quando a documentação não existe', async () => {
      await expect(
        updateDocument.execute(randomUUID(), {
          attachments: [createAttachmentData()],
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('não persiste mudanças se a validação falhar', async () => {
      const original = await documents.create(
        CargoDocument.create(createCargoDocumentData()),
      );
      const update = jest.spyOn(documents, 'update');
      await expect(
        updateDocument.execute(original.id, {
          attachments: [createAttachmentData({ name: ' ' })],
        }),
      ).rejects.toThrow(BusinessRuleError);
      expect(update).not.toHaveBeenCalled();
      expect((await documents.findById(original.id))?.toObject()).toEqual(
        original.toObject(),
      );
    });

    it('não altera a documentação já enviada para análise', async () => {
      const document = await documents.create(
        CargoDocument.restore({
          ...CargoDocument.create(createCargoDocumentData()).toObject(),
          status: CargoDocumentStatus.UNDER_REVIEW,
          submittedAt: new Date(),
        }),
      );
      await expect(
        updateDocument.execute(document.id, {
          attachments: [createAttachmentData()],
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('DeleteCargoDocumentUseCase', () => {
    it('remove a preparação existente e informa ausência nas tentativas seguintes', async () => {
      const document = await documents.create(
        CargoDocument.create(createCargoDocumentData()),
      );
      await deleteDocument.execute(document.id.toUpperCase());
      expect(await documents.findById(document.id)).toBeNull();
      await expect(deleteDocument.execute(document.id)).rejects.toThrow(
        ResourceNotFoundError,
      );
      await expect(deleteDocument.execute(randomUUID())).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('preserva documentações em análise e seus anexos', async () => {
      const document = await documents.create(
        CargoDocument.restore({
          ...CargoDocument.create(createCargoDocumentData()).toObject(),
          status: CargoDocumentStatus.UNDER_REVIEW,
        }),
      );
      const remove = jest.spyOn(documents, 'remove');
      await expect(deleteDocument.execute(document.id)).rejects.toThrow(
        ConflictError,
      );
      expect(remove).not.toHaveBeenCalled();
      expect((await documents.findById(document.id))?.attachments).toHaveLength(
        1,
      );
    });
  });
});
