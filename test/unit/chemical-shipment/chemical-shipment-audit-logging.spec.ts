import { beforeEach, describe, expect, it } from '@jest/globals';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.js';
import { StartShipmentAnalysisUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/status/start-shipment-analysis.use-case.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { ChemicalProductRepositoryMock } from '../../mocks/chemical-product-repository.mock.js';
import { AuditLogRecorderMock } from '../../mocks/audit-log-recorder.mock.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';

describe('Chemical Shipment Audit Logging (unit)', () => {
  let shipmentsRepo: ChemicalShipmentMock;
  let usersRepo: UserRepositoryMock;
  let productsRepo: ChemicalProductRepositoryMock;
  let auditLogs: AuditLogRecorderMock;
  let responsibleUser: User;
  let product: ChemicalProduct;

  beforeEach(async () => {
    shipmentsRepo = new ChemicalShipmentMock();
    usersRepo = new UserRepositoryMock();
    productsRepo = new ChemicalProductRepositoryMock();
    auditLogs = new AuditLogRecorderMock();

    responsibleUser = await usersRepo.create(
      User.create({
        name: 'Carlos Responsável',
        email: 'carlos@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );

    product = await productsRepo.create(
      ChemicalProduct.create({
        code: 'H2SO4-98',
        technicalName: 'Ácido sulfúrico',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        status: ProductStatus.ACTIVE,
        responsibleUserId: responsibleUser.id,
      }),
    );
  });

  it('registra log ao registrar carga química', async () => {
    const useCase = new CreateChemicalShipmentUseCase(
      shipmentsRepo,
      usersRepo,
      productsRepo,
      auditLogs,
    );

    const shipment = await useCase.execute(
      {
        productId: product.id,
        quantityProduct: 500,
        responsibleUserId: responsibleUser.id,
        documentsIds: 'DOC-123',
      },
      { id: responsibleUser.id, name: responsibleUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_SHIPMENT,
      entityId: shipment.id,
      action: AuditAction.CREATED,
    });
    expect(auditLogs.logs[0].description).toContain(shipment.id);
    expect(auditLogs.logs[0].description).toContain('Carlos Responsável');
  });

  it('registra log ao atualizar dados da carga química', async () => {
    const shipment = await shipmentsRepo.create(
      ChemicalShipment.create({
        productId: product.id,
        quantityProduct: 200,
        responsibleUserId: responsibleUser.id,
        documentsIds: 'DOC-123',
      }),
    );

    const useCase = new UpdateChemicalShipmentUseCase(
      shipmentsRepo,
      usersRepo,
      productsRepo,
      auditLogs,
    );

    await useCase.execute(
      shipment.id,
      { quantityProduct: 300 },
      { id: responsibleUser.id, name: responsibleUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_SHIPMENT,
      entityId: shipment.id,
      action: AuditAction.UPDATED,
    });
    expect(auditLogs.logs[0].description).toContain(shipment.id);
  });

  it('registra log ao alterar status da carga química', async () => {
    const shipment = await shipmentsRepo.create(
      ChemicalShipment.create({
        productId: product.id,
        quantityProduct: 200,
        responsibleUserId: responsibleUser.id,
        documentsIds: 'DOC-123',
      }),
    );

    const useCase = new StartShipmentAnalysisUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(shipment.id, {
      id: 'op-1',
      name: 'Operador Santos',
    });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_SHIPMENT,
      entityId: shipment.id,
      action: AuditAction.STATUS_CHANGED,
    });
    expect(auditLogs.logs[0].description).toContain('Em análise');
    expect(auditLogs.logs[0].description).toContain('Operador Santos');
  });

  it('registra log ao remover carga química', async () => {
    const shipment = await shipmentsRepo.create(
      ChemicalShipment.create({
        productId: product.id,
        quantityProduct: 100,
        responsibleUserId: responsibleUser.id,
        documentsIds: 'DOC-123',
      }),
    );

    const useCase = new DeleteChemicalShipmentUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(shipment.id, {
      id: responsibleUser.id,
      name: responsibleUser.name,
    });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_SHIPMENT,
      entityId: shipment.id,
      action: AuditAction.DELETED,
    });
    expect(auditLogs.logs[0].description).toContain(shipment.id);
  });
});
