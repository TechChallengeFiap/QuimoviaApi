import { beforeEach, describe, expect, it } from '@jest/globals';
import { CreateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/create-shipment-document.use-case.js';
import { UpdateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/update-shipment-document.use-case.js';
import { DeleteShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/delete-shipment-document.use-case.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ShipmentDocumentRepositoryMock } from '../../mocks/shipment-document-repository.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { AuditLogRecorderMock } from '../../mocks/audit-log-recorder.mock.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import {
  createAttachmentData,
  createShipmentDocumentData,
} from '../../mocks/shipment-document.fixture.js';

describe('Document Compliance Audit Logging (unit)', () => {
  let documentsRepo: ShipmentDocumentRepositoryMock;
  let usersRepo: UserRepositoryMock;
  let auditLogs: AuditLogRecorderMock;
  let shipperUser: User;

  beforeEach(async () => {
    documentsRepo = new ShipmentDocumentRepositoryMock();
    usersRepo = new UserRepositoryMock();
    auditLogs = new AuditLogRecorderMock();

    shipperUser = await usersRepo.create(
      User.create({
        name: 'Embarcador Santos',
        email: 'santos@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.OPERATOR,
      }),
    );
  });

  it('registra log ao cadastrar documentação de carga', async () => {
    const useCase = new CreateShipmentDocumentUseCase(
      documentsRepo,
      usersRepo,
      auditLogs,
    );

    const doc = await useCase.execute(
      createShipmentDocumentData({ shipperId: shipperUser.id }),
      { id: shipperUser.id, name: shipperUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.SHIPMENT_DOCUMENT,
      entityId: doc.id,
      action: AuditAction.CREATED,
      actorName: 'Embarcador Santos',
    });
    expect(auditLogs.logs[0].description).toContain(doc.shipmentId);
  });

  it('registra log ao atualizar documentação de carga', async () => {
    const doc = await documentsRepo.create(
      ShipmentDocument.create(
        createShipmentDocumentData({ shipperId: shipperUser.id }),
      ),
    );

    const useCase = new UpdateShipmentDocumentUseCase(
      documentsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(
      doc.id,
      {
        attachments: [
          createAttachmentData({
            name: 'FISPQ revisada',
          }),
        ],
      },
      { id: shipperUser.id },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.SHIPMENT_DOCUMENT,
      entityId: doc.id,
      action: AuditAction.UPDATED,
      actorName: 'Embarcador Santos',
    });
    expect(auditLogs.logs[0].description).toContain('revisou');
  });

  it('registra log ao excluir documentação de carga', async () => {
    const doc = await documentsRepo.create(
      ShipmentDocument.create(
        createShipmentDocumentData({ shipperId: shipperUser.id }),
      ),
    );

    const useCase = new DeleteShipmentDocumentUseCase(
      documentsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(doc.id, { id: shipperUser.id });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.SHIPMENT_DOCUMENT,
      entityId: doc.id,
      action: AuditAction.DELETED,
      actorName: 'Embarcador Santos',
    });
    expect(auditLogs.logs[0].description).toContain('removeu');
  });
});
