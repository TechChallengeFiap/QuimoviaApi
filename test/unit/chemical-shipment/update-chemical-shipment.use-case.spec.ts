import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/update-chemical-shipment.use-case.ts';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.ts';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.ts';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.ts';

describe('UpdateChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let users: UserRepositoryMock;
  let useCase: UpdateChemicalShipmentUseCase;

  beforeEach(async () => {
    chemicalShipments = new ChemicalShipmentMock();
    users = new UserRepositoryMock();
    useCase = new UpdateChemicalShipmentUseCase(chemicalShipments, users);

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
    status = StatusShipment.ANALYZING,
  ): Promise<ChemicalShipment> {
    const shipment = ChemicalShipment.create({
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    });
    if (status !== StatusShipment.ANALYZING) {
      shipment.updateChemicalShipmentStatus(shipment, status);
    }
    return chemicalShipments.create(shipment);
  }

  it('atualiza a carga química com sucesso incluindo o usuário responsável existente', async () => {
    const shipment = await createSampleShipment();

    const updated = await useCase.execute(shipment.id, {
      productId: 'prod-002',
      responsibleUserId: 'user-002',
      documentsIds: 'doc-002',
      status: StatusShipment.INSPECTION,
    });

    expect(updated.productId).toBe('prod-002');
    expect(updated.responsibleUserId).toBe('user-002');
    expect(updated.documentsIds).toBe('doc-002');
    expect(updated.status).toBe(StatusShipment.INSPECTION);
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

  it('deve lançar BusinessRuleError ao tentar atualizar carga reprovada', async () => {
    const shipment = await createSampleShipment(StatusShipment.REPROVED);

    await expect(
      useCase.execute(shipment.id, {
        responsibleUserId: 'user-002',
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('deve lançar BusinessRuleError ao tentar atualizar carga aprovada', async () => {
    const shipment = await createSampleShipment(StatusShipment.APPROVED);

    await expect(
      useCase.execute(shipment.id, {
        responsibleUserId: 'user-002',
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
