import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { ChemicalProductRepositoryMock } from '../../mocks/chemical-product-repository.mock.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

describe('UpdateChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let users: UserRepositoryMock;
  let chemicalProducts: ChemicalProductRepositoryMock;
  let useCase: UpdateChemicalShipmentUseCase;

  beforeEach(async () => {
    chemicalShipments = new ChemicalShipmentMock();
    users = new UserRepositoryMock();
    chemicalProducts = new ChemicalProductRepositoryMock();
    useCase = new UpdateChemicalShipmentUseCase(
      chemicalShipments,
      users,
      chemicalProducts,
    );

    await chemicalProducts.create(
      ChemicalProduct.restore({
        id: 'prod-001',
        code: 'PROD-001',
        technicalName: 'Ácido Clorídrico',
        tradeName: null,
        unNumber: '1789',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        status: ProductStatus.ACTIVE,
        responsibleUserId: 'user-001',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await chemicalProducts.create(
      ChemicalProduct.restore({
        id: 'prod-002',
        code: 'PROD-002',
        technicalName: 'Hidróxido de Sódio',
        tradeName: 'Soda Cáustica',
        unNumber: '1823',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.SOLID,
        status: ProductStatus.ACTIVE,
        responsibleUserId: 'user-001',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await chemicalProducts.create(
      ChemicalProduct.restore({
        id: 'prod-inactive',
        code: 'PROD-003',
        technicalName: 'Produto Inativo',
        tradeName: null,
        unNumber: '1993',
        riskClass: ProductRiskClass.FLAMMABLE_LIQUIDS,
        physicalState: ProductPhysicalState.LIQUID,
        status: ProductStatus.INACTIVE,
        responsibleUserId: 'user-001',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await users.create(
      User.restore({
        id: 'user-001',
        name: 'Operador Teste',
        email: 'operador@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.PORT_OPERATOR,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await users.create(
      User.restore({
        id: 'user-002',
        name: 'Segundo Operador',
        email: 'operador2@quimovia.com',
        passwordHash: 'hash',
        role: UserRole.TECHNICAL_MANAGER,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  async function createSampleShipment(
    status: StatusShipment = StatusShipment.REGISTERED,
  ): Promise<ChemicalShipment> {
    const shipment = ChemicalShipment.restore({
      id: 'ship-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      status,
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
      quantityProduct: 50,
    });
    return chemicalShipments.create(shipment);
  }

  it('atualiza a carga química com sucesso incluindo o usuário responsável existente e produto válido', async () => {
    const shipment = await createSampleShipment();

    const updated = await useCase.execute(shipment.id, {
      productId: 'prod-002',
      responsibleUserId: 'user-002',
      documentsIds: 'doc-002',
      quantityProduct: 300,
    });

    expect(updated.productId).toBe('prod-002');
    expect(updated.responsibleUserId).toBe('user-002');
    expect(updated.documentsIds).toBe('doc-002');
    expect(updated.quantityProduct).toBe(300);
  });

  it('deve lançar ResourceNotFoundError quando a carga química não for encontrada', async () => {
    await expect(
      useCase.execute('shipment-inexistente', {
        productId: 'prod-002',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('deve lançar ResourceNotFoundError quando o usuário responsável não existir na atualização', async () => {
    const shipment = await createSampleShipment();

    await expect(
      useCase.execute(shipment.id, {
        responsibleUserId: 'user-inexistente',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('deve lançar ResourceNotFoundError quando o produto químico não existir na atualização', async () => {
    const shipment = await createSampleShipment();

    await expect(
      useCase.execute(shipment.id, {
        productId: 'prod-inexistente',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('deve lançar BusinessRuleError ao tentar atualizar carga com produto químico inativo', async () => {
    const shipment = await createSampleShipment();

    await expect(
      useCase.execute(shipment.id, {
        productId: 'prod-inactive',
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('deve lançar BusinessRuleError ao tentar atualizar carga reprovada', async () => {
    const shipment = await createSampleShipment(StatusShipment.REPROVED);

    await expect(
      useCase.execute(shipment.id, {
        responsibleUserId: 'user-002',
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('deve atualizar os campos adicionais code, unit, origin, destination e entryDate com sucesso', async () => {
    const shipment = await createSampleShipment();
    const newEntryDate = new Date('2026-10-25T10:00:00.000Z');

    const updated = await useCase.execute(shipment.id, {
      code: 'CARGO-UPDATED-001',
      unit: 'toneladas',
      origin: 'Porto de Paranaguá',
      destination: 'Terminal Químico de Santos',
      entryDate: newEntryDate,
    });

    expect(updated.code).toBe('CARGO-UPDATED-001');
    expect(updated.unit).toBe('toneladas');
    expect(updated.origin).toBe('Porto de Paranaguá');
    expect(updated.destination).toBe('Terminal Químico de Santos');
    expect(updated.entryDate).toEqual(newEntryDate);
  });
});
