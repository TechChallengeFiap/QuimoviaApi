import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CreateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/create-inspection.use-case.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { InspectionRepositoryMock } from '../../../mocks/inspection-repository.mock.js';
import { ChemicalShipmentMock } from '../../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../../mocks/user-repository.mock.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

describe('CreateInspectionUseCase', () => {
  let inspections: InspectionRepositoryMock;
  let chemicalShipments: ChemicalShipmentMock;
  let users: UserRepositoryMock;
  let useCase: CreateInspectionUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  const input = {
    cargoId: 'cargo-001',
    compositionVersion: 1,
    scope: InspectionScope.CARGO,
    inspectorId: 'fiscal-001',
    requirements: [InspectionRequirement.NO_LEAKAGE],
  };

  beforeEach(async () => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    inspections = new InspectionRepositoryMock();
    chemicalShipments = new ChemicalShipmentMock();
    users = new UserRepositoryMock();

    await chemicalShipments.create(
      ChemicalShipment.restore({
        id: 'cargo-001',
        productId: 'prod-001',
        quantityProduct: 100,
        status: StatusShipment.ANALYZING,
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );

    await users.create(
      User.restore({
        id: 'fiscal-001',
        name: 'Carlos Fiscal',
        email: 'carlos.fiscal@quimovia.com',
        passwordHash: 'hash123',
        role: UserRole.PORT_OPERATOR,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    useCase = new CreateInspectionUseCase(
      inspections,
      chemicalShipments,
      users,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cadastra uma inspeção pendente quando carga e fiscal existem', async () => {
    const inspection = await useCase.execute(input);

    expect(inspection.status).toBe(InspectionStatus.PENDING);
    expect(await inspections.findById(inspection.id)).not.toBeNull();
  });

  it('lança ResourceNotFoundError quando cargoId não existe', async () => {
    await expect(
      useCase.execute({ ...input, cargoId: 'cargo-inexistente' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando inspectorId não existe', async () => {
    await expect(
      useCase.execute({ ...input, inspectorId: 'fiscal-inexistente' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('lança BusinessRuleError quando o fiscal não está ativo', async () => {
    await users.create(
      User.restore({
        id: 'fiscal-inativo',
        name: 'Fiscal Inativo',
        email: 'fiscal.inativo@quimovia.com',
        passwordHash: 'hash123',
        role: UserRole.PORT_OPERATOR,
        status: UserStatus.INACTIVE,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ ...input, inspectorId: 'fiscal-inativo' }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('lança BusinessRuleError quando o fiscal está bloqueado', async () => {
    await users.create(
      User.restore({
        id: 'fiscal-bloqueado',
        name: 'Fiscal Bloqueado',
        email: 'fiscal.bloqueado@quimovia.com',
        passwordHash: 'hash123',
        role: UserRole.PORT_OPERATOR,
        status: UserStatus.BLOCKED,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ ...input, inspectorId: 'fiscal-bloqueado' }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('rejeita escopo de item da carga sem o identificador do item', async () => {
    await expect(
      useCase.execute({ ...input, scope: InspectionScope.CARGO_ITEM }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(inspections, 'create').mockRejectedValueOnce(failure);

    await expect(useCase.execute(input)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao cadastrar a inspeção: Falha de conexão com o banco',
      failure.stack,
    );
  });
});
