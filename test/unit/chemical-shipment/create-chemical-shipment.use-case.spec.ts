import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/create-chemical-shipment.use-case.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

describe('CreateChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let users: UserRepositoryMock;
  let useCase: CreateChemicalShipmentUseCase;

  beforeEach(async () => {
    chemicalShipments = new ChemicalShipmentMock();
    users = new UserRepositoryMock();
    useCase = new CreateChemicalShipmentUseCase(chemicalShipments, users);

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
  });

  it('cria uma carga química com status inicial ANALYZING', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    const chemicalShipment = await useCase.execute(input);

    expect(chemicalShipment.status).toBe(StatusShipment.ANALYZING);
    expect(
      await chemicalShipments.findById(chemicalShipment.id),
    ).not.toBeNull();
  });

  it('deve lançar ResourceNotFoundError quando o usuário responsável não existir', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-inexistente',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(ResourceNotFoundError);
  });

  it('deve rejeitar um productId invalido', async () => {
    const input = {
      productId: '',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'O productId não pode estar vazio',
    );
  });

  it('deve rejeitar um responsibleUserId invalido', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: '',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'O responsibleUserId não pode estar vazio',
    );
  });

  it('deve rejeitar um documentsIds invalido', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: '',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'O documentsIds não pode estar vazio',
    );
  });
});

