import { beforeEach, describe, expect, it } from '@jest/globals';
import { CreateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { UpdateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-chemical-product.use-case.js';
import { ActivateChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/activate-chemical-product.use-case.js';
import { DeleteChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/delete-chemical-product.use-case.js';
import { RestoreChemicalProductUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/restore-chemical-product.use-case.js';
import { LotRepositoryMock } from '../../mocks/lot-repository.mock.js';
import { AddProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/add-product-document.use-case.js';
import { UpdateProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/update-product-document.use-case.js';
import { RemoveProductDocumentUseCase } from '@/modules/chemical-products/application/use-cases/chemical-products/remove-product-document.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { ChemicalProductRepositoryMock } from '../../mocks/chemical-product-repository.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { AuditLogRecorderMock } from '../../mocks/audit-log-recorder.mock.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';

describe('Chemical Products Audit Logging (unit)', () => {
  let productsRepo: ChemicalProductRepositoryMock;
  let usersRepo: UserRepositoryMock;
  let auditLogs: AuditLogRecorderMock;
  let responsibleUser: User;

  beforeEach(async () => {
    productsRepo = new ChemicalProductRepositoryMock();
    usersRepo = new UserRepositoryMock();
    auditLogs = new AuditLogRecorderMock();

    responsibleUser = await usersRepo.create(
      User.create({
        name: 'Dr. Roberto Químico',
        email: 'roberto@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
      }),
    );
  });

  it('registra log ao cadastrar produto químico', async () => {
    const useCase = new CreateChemicalProductUseCase(
      productsRepo,
      usersRepo,
      auditLogs,
    );

    const product = await useCase.execute(
      {
        code: 'H2SO4-98',
        technicalName: 'Ácido sulfúrico 98%',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: responsibleUser.id,
      },
      { id: responsibleUser.id, name: responsibleUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_PRODUCT,
      entityId: product.id,
      action: AuditAction.CREATED,
    });
    expect(auditLogs.logs[0].description).toContain('Ácido sulfúrico 98%');
    expect(auditLogs.logs[0].description).toContain('Dr. Roberto Químico');
  });

  it('registra log ao atualizar produto químico', async () => {
    const product = await productsRepo.create(
      ChemicalProduct.create({
        code: 'CL-01',
        technicalName: 'Cloro líquido',
        unNumber: '1017',
        riskClass: ProductRiskClass.GASES,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: responsibleUser.id,
      }),
    );

    const useCase = new UpdateChemicalProductUseCase(
      productsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(
      product.id,
      { technicalName: 'Cloro gasoso liquefeito' },
      { id: responsibleUser.id, name: responsibleUser.name },
    );

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_PRODUCT,
      entityId: product.id,
      action: AuditAction.UPDATED,
    });
    expect(auditLogs.logs[0].description).toContain('Cloro gasoso liquefeito');
  });

  it('registra log ao alterar status do produto químico', async () => {
    const product = await productsRepo.create(
      ChemicalProduct.create({
        code: 'NAOH-50',
        technicalName: 'Hidróxido de sódio',
        unNumber: '1824',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: responsibleUser.id,
      }),
    );

    const useCase = new ActivateChemicalProductUseCase(
      productsRepo,
      usersRepo,
      auditLogs,
    );

    await useCase.execute(product.id, {
      id: 'op-1',
      name: 'Operador Silva',
    });

    expect((await productsRepo.findById(product.id))?.status).toBe(ProductStatus.ACTIVE);

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_PRODUCT,
      entityId: product.id,
      action: AuditAction.STATUS_CHANGED,
    });
    expect(auditLogs.logs[0].description).toContain('ACTIVE');
    expect(auditLogs.logs[0].description).toContain('Operador Silva');
  });

  it('registra log ao remover produto químico', async () => {
    const product = await productsRepo.create(
      ChemicalProduct.create({
        code: 'SOLV-01',
        technicalName: 'Solvente X',
        unNumber: '1993',
        riskClass: ProductRiskClass.FLAMMABLE_LIQUIDS,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: responsibleUser.id,
      }),
    );

    const useCase = new DeleteChemicalProductUseCase(
      productsRepo,
      new LotRepositoryMock(),
      usersRepo,
      auditLogs,
    );

    await useCase.execute(product.id, {
      id: responsibleUser.id,
      name: responsibleUser.name,
    });

    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0]).toMatchObject({
      entityType: AuditedEntity.CHEMICAL_PRODUCT,
      entityId: product.id,
      action: AuditAction.DELETED,
    });
    expect(auditLogs.logs[0].description).toContain('Solvente X');

    const restore = new RestoreChemicalProductUseCase(productsRepo, usersRepo, auditLogs);
    await restore.execute(product.id, { id: responsibleUser.id, name: responsibleUser.name });

    expect(auditLogs.logs).toHaveLength(2);
    expect(auditLogs.logs[1]).toMatchObject({
      entityId: product.id,
      action: AuditAction.UPDATED,
      details: { restored: true },
    });
  });

  it('registra log ao adicionar, atualizar e remover documento do produto', async () => {
    const product = await productsRepo.create(
      ChemicalProduct.create({
        code: 'ACET-01',
        technicalName: 'Acetona',
        unNumber: '1090',
        riskClass: ProductRiskClass.FLAMMABLE_LIQUIDS,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: responsibleUser.id,
      }),
    );

    const addUseCase = new AddProductDocumentUseCase(
      productsRepo,
      usersRepo,
      auditLogs,
    );
    const updateUseCase = new UpdateProductDocumentUseCase(
      productsRepo,
      usersRepo,
      auditLogs,
    );
    const removeUseCase = new RemoveProductDocumentUseCase(
      productsRepo,
      usersRepo,
      auditLogs,
    );

    // 1. Add
    const updatedWithDoc = await addUseCase.execute(
      product.id,
      {
        type: ProductDocumentType.SAFETY_DATA_SHEET,
        number: 'FISPQ-001',
        filePath: 'path/fispq.pdf',
      },
      { id: responsibleUser.id, name: responsibleUser.name },
    );
    expect(auditLogs.logs).toHaveLength(1);
    expect(auditLogs.logs[0].action).toBe(AuditAction.DOCUMENT_ADDED);

    const docId = updatedWithDoc.documents[0].id;

    // 2. Update
    await updateUseCase.execute(
      product.id,
      docId,
      { number: 'FISPQ-001-REV1' },
      { id: responsibleUser.id, name: responsibleUser.name },
    );
    expect(auditLogs.logs).toHaveLength(2);
    expect(auditLogs.logs[1].action).toBe(AuditAction.DOCUMENT_UPDATED);

    // 3. Remove
    await removeUseCase.execute(product.id, docId, {
      id: responsibleUser.id,
      name: responsibleUser.name,
    });
    expect(auditLogs.logs).toHaveLength(3);
    expect(auditLogs.logs[2].action).toBe(AuditAction.DOCUMENT_REMOVED);
  });
});
