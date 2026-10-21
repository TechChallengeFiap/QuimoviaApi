import { beforeEach, describe, expect, it } from '@jest/globals';
import { CreateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/create-inspection.use-case.js';
import { UpdateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/update-inspection.use-case.js';
import { DeleteInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/delete-inspection.use-case.js';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { InspectionRepositoryMock } from '../../mocks/inspection-repository.mock.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { AuditLogRecorderMock } from '../../mocks/audit-log-recorder.mock.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';

describe('Inspection Audit Logging (unit)', () => {
  let inspectionsRepo: InspectionRepositoryMock;
  let shipmentsRepo: ChemicalShipmentMock;
  let usersRepo: UserRepositoryMock;
  let auditLogs: AuditLogRecorderMock;
  let inspectorUser: User;
  let shipment: ChemicalShipment;

  beforeEach(async () => {
    inspectionsRepo = new InspectionRepositoryMock();
    shipmentsRepo = new ChemicalShipmentMock();
    usersRepo = new UserRepositoryMock();
    auditLogs = new AuditLogRecorderMock();

    inspectorUser = await usersRepo.create(
      User.create({
        name: 'Inspetor Lima',
        email: 'lima@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.QUALITY_ANALYST,
      }),
    );

    shipment = await shipmentsRepo.create(
      ChemicalShipment.create({
        productId: 'prod-123',
        quantityProduct: 100,
        responsibleUserId: inspectorUser.id,
        documentsIds: 'doc-123',
      }),
    );
  });

  it('registra log ao agendar inspeção', async () => {
    const useCase = new CreateInspectionUseCase(
      inspectionsRepo,
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );

    const inspection = await useCase.execute(
      {
        cargoId: shipment.id,
        compositionVersion: 1,
        scope: InspectionScope.ENTIRE_CARGO,
        inspectorId: inspectorUser.id,
        requirements: [InspectionRequirement.SEAL_INTACT],
      },
      { id: inspectorUser.id, name: inspectorUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.INSPECTION,
      entityId: inspection.id,
      action: AuditAction.CREATED,
    });
    expect(auditLogs.logs[0].description).toContain(shipment.id);
    expect(auditLogs.logs[0].description).toContain('Inspetor Lima');
  });

  it('registra log ao alterar status da inspeção', async () => {
    const inspection = await inspectionsRepo.create(
      Inspection.create({
        cargoId: shipment.id,
        compositionVersion: 1,
        scope: InspectionScope.ENTIRE_CARGO,
        inspectorId: inspectorUser.id,
        requirements: [InspectionRequirement.SEAL_INTACT],
      }),
    );

    const useCase = new UpdateInspectionUseCase(
      inspectionsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(
      inspection.id,
      { status: InspectionStatus.IN_PROGRESS },
      { id: inspectorUser.id, name: inspectorUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.INSPECTION,
      entityId: inspection.id,
      action: AuditAction.STATUS_CHANGED,
    });
    expect(auditLogs.logs[0].description).toContain('IN_PROGRESS');
  });

  it('registra log ao remover inspeção', async () => {
    const inspection = await inspectionsRepo.create(
      Inspection.create({
        cargoId: shipment.id,
        compositionVersion: 1,
        scope: InspectionScope.ENTIRE_CARGO,
        inspectorId: inspectorUser.id,
        requirements: [InspectionRequirement.SEAL_INTACT],
      }),
    );

    const useCase = new DeleteInspectionUseCase(
      inspectionsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(inspection.id, {
      id: inspectorUser.id,
      name: inspectorUser.name,
    });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.INSPECTION,
      entityId: inspection.id,
      action: AuditAction.DELETED,
    });
    expect(auditLogs.logs[0].description).toContain(inspection.id);
  });
});
