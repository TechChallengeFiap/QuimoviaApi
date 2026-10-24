import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import { CreateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/create-shipment-document.use-case.js';
import { DeleteShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/delete-shipment-document.use-case.js';
import { FindShipmentDocumentByIdUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/find-shipment-document-by-id.use-case.js';
import { ListShipmentDocumentsUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/list-shipment-documents.use-case.js';
import { UpdateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/update-shipment-document.use-case.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ShipmentDocumentRepositoryMock } from '../../mocks/shipment-document-repository.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import {
  createAttachmentData,
  createShipmentDocumentData,
  SHIPPER_ID,
} from '../../mocks/shipment-document.fixture.js';

describe('Casos de uso de ShipmentDocument', () => {
  let documents: ShipmentDocumentRepositoryMock;
  let users: UserRepositoryMock;
  let responsibleUser: User;
  let createDocument: CreateShipmentDocumentUseCase;
  let findDocument: FindShipmentDocumentByIdUseCase;
  let listDocuments: ListShipmentDocumentsUseCase;
  let updateDocument: UpdateShipmentDocumentUseCase;
  let deleteDocument: DeleteShipmentDocumentUseCase;

  beforeEach(async () => {
    users = new UserRepositoryMock();
    responsibleUser = await users.create(
      User.create({
        name: 'Maria Silva',
        email: 'maria@example.com',
        passwordHash: 'internal-password-hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
    documents = new ShipmentDocumentRepositoryMock(users);
    createDocument = new CreateShipmentDocumentUseCase(documents, users);
    findDocument = new FindShipmentDocumentByIdUseCase(documents);
    listDocuments = new ListShipmentDocumentsUseCase(documents);
    updateDocument = new UpdateShipmentDocumentUseCase(documents, users);
    deleteDocument = new DeleteShipmentDocumentUseCase(documents);
  });

  describe('CreateShipmentDocumentUseCase', () => {
    it('creates multiple documents for an existing responsible user and normalizes the identifier', async () => {
      for (let index = 0; index < 2; index++) {
        const document = await createDocument.execute(
          createShipmentDocumentData({
            responsibleUserId: responsibleUser.id.toUpperCase(),
          }),
        );
        expect(document.responsibleUserId).toBe(responsibleUser.id);
        expect(document.responsibleUser).toEqual({
          id: responsibleUser.id,
          name: responsibleUser.name,
        });
      }
    });

    it('rejects an unknown responsible user without persisting the document', async () => {
      const create = jest.spyOn(documents, 'create');
      await expect(
        createDocument.execute(
          createShipmentDocumentData({
            responsibleUserId: randomUUID(),
          }),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
      expect(create).not.toHaveBeenCalled();
    });
    it('persiste a raiz e seus anexos e devolve o registro', async () => {
      const document = await createDocument.execute(
        createShipmentDocumentData(),
      );
      expect((await documents.findById(document.id))?.toObject()).toEqual(
        document.toObject(),
      );
      expect(document.attachments).toHaveLength(1);
    });

    it('rejeita outra documentação para a mesma carga, inclusive em caixa diferente', async () => {
      const input = createShipmentDocumentData();
      await createDocument.execute(input);
      await expect(
        createDocument.execute({
          ...input,
          shipmentId: input.shipmentId.toUpperCase(),
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('não consulta nem grava o repositório se o cadastro for inválido', async () => {
      const create = jest.spyOn(documents, 'create');
      const find = jest.spyOn(documents, 'findByShipmentId');
      await expect(
        createDocument.execute(
          createShipmentDocumentData({ compositionVersion: 0 }),
        ),
      ).rejects.toThrow(BusinessRuleError);
      expect(create).not.toHaveBeenCalled();
      expect(find).not.toHaveBeenCalled();
    });
  });

  describe('FindShipmentDocumentByIdUseCase', () => {
    it('encontra pelo UUID sem distinguir caixa e rejeita inexistente', async () => {
      const document = await documents.create(
        ShipmentDocument.create(createShipmentDocumentData()),
      );
      expect((await findDocument.execute(document.id.toUpperCase())).id).toBe(
        document.id,
      );
      await expect(findDocument.execute(randomUUID())).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });

  describe('ListShipmentDocumentsUseCase', () => {
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
        ShipmentDocument.create(createShipmentDocumentData()),
      );
      await documents.create(
        ShipmentDocument.create(createShipmentDocumentData()),
      );
      await documents.create(
        ShipmentDocument.create(
          createShipmentDocumentData({ shipperId: randomUUID() }),
        ),
      );
      const filters = {
        shipperId: SHIPPER_ID.toUpperCase(),
        status: ShipmentDocumentStatus.PENDING,
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
            shipmentId: first.shipmentId.toUpperCase(),
          })
        ).total,
      ).toBe(1);
      expect(
        (await listDocuments.execute({ ...filters, page: 3 })).items,
      ).toEqual([]);
      expect(
        (
          await listDocuments.execute({
            status: ShipmentDocumentStatus.UNDER_REVIEW,
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

  describe('UpdateShipmentDocumentUseCase', () => {
    it('assigns and changes the responsible user without changing attachments', async () => {
      const original = await createDocument.execute(
        createShipmentDocumentData(),
      );
      const assigned = await updateDocument.execute(original.id, {
        responsibleUserId: responsibleUser.id.toUpperCase(),
      });
      expect(assigned.responsibleUser).toEqual({
        id: responsibleUser.id,
        name: responsibleUser.name,
      });
      const replacement = await users.create(
        User.create({
          name: 'João Santos',
          email: 'joao@example.com',
          passwordHash: 'other-hash',
          role: UserRole.TECHNICAL_MANAGER,
        }),
      );
      const updated = await updateDocument.execute(original.id, {
        responsibleUserId: replacement.id,
      });
      expect(updated.responsibleUserId).toBe(replacement.id);
      expect(updated.responsibleUser).toEqual({
        id: replacement.id,
        name: replacement.name,
      });
      expect(updated.attachments).toEqual(original.attachments);
      expect(updated.revision).toBe(2);
    });

    it('preserves the responsible user when only attachments change', async () => {
      const original = await createDocument.execute(
        createShipmentDocumentData({ responsibleUserId: responsibleUser.id }),
      );
      const updated = await updateDocument.execute(original.id, {
        attachments: [createAttachmentData()],
      });
      expect(updated.responsibleUserId).toBe(responsibleUser.id);
      expect(updated.responsibleUser).toEqual({
        id: responsibleUser.id,
        name: responsibleUser.name,
      });
      expect((await documents.findById(original.id))?.responsibleUserId).toBe(
        responsibleUser.id,
      );
    });

    it('rejects an unknown replacement and preserves the entire document', async () => {
      const original = await createDocument.execute(
        createShipmentDocumentData({ responsibleUserId: responsibleUser.id }),
      );
      const update = jest.spyOn(documents, 'update');
      await expect(
        updateDocument.execute(original.id, {
          responsibleUserId: randomUUID(),
          attachments: [createAttachmentData()],
        }),
      ).rejects.toThrow(ResourceNotFoundError);
      expect(update).not.toHaveBeenCalled();
      expect((await documents.findById(original.id))?.toObject()).toEqual(
        original.toObject(),
      );
    });

    it('preserves editing restrictions when changing the responsible user', async () => {
      const original = await documents.create(
        ShipmentDocument.restore({
          ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
          status: ShipmentDocumentStatus.UNDER_REVIEW,
          submittedAt: new Date(),
        }),
      );
      await expect(
        updateDocument.execute(original.id, {
          responsibleUserId: responsibleUser.id,
        }),
      ).rejects.toThrow(ConflictError);
    });
    it('atualiza anexos preservando vínculos, datas e histórico', async () => {
      const original = await documents.create(
        ShipmentDocument.create(createShipmentDocumentData()),
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
        shipmentId: original.shipmentId,
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
        ShipmentDocument.create(createShipmentDocumentData()),
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
        ShipmentDocument.restore({
          ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
          status: ShipmentDocumentStatus.UNDER_REVIEW,
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

  describe('DeleteShipmentDocumentUseCase', () => {
    it('remove a preparação existente e informa ausência nas tentativas seguintes', async () => {
      const document = await documents.create(
        ShipmentDocument.create(createShipmentDocumentData()),
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
        ShipmentDocument.restore({
          ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
          status: ShipmentDocumentStatus.UNDER_REVIEW,
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
