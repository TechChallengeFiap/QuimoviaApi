import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/create-chemical-shipment.use-case.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import {
  UserDirectoryMock,
  userSummary,
} from '../../mocks/user-directory.mock.js';

describe('CreateChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let useCase: CreateChemicalShipmentUseCase;

  beforeEach(() => {
    chemicalShipments = new ChemicalShipmentMock();
    useCase = new CreateChemicalShipmentUseCase(
      chemicalShipments,
      new UserDirectoryMock([
        userSummary({ id: 'user-001', name: 'Operador Teste' }),
      ]),
    );
  });

  it('cria uma carga química com status inicial ANALYZING e devolve o responsável', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    const { shipment, responsibleUser } = await useCase.execute(input);

    expect(shipment.status).toBe(StatusShipment.ANALYZING);
    expect(await chemicalShipments.findById(shipment.id)).not.toBeNull();
    expect(responsibleUser).toMatchObject({
      id: 'user-001',
      name: 'Operador Teste',
    });
  });

  it('deve lançar ResourceNotFoundError quando o usuário responsável não existir', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-inexistente',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(ResourceNotFoundError);
    expect(
      (await chemicalShipments.list({ page: 1, pageSize: 20 })).total,
    ).toBe(0);
  });

  it('deve rejeitar um productId invalido', async () => {
    const input = {
      productId: '',
      responsibleUserId: 'user-001',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      new BusinessRuleError('O productId não pode estar vazio'),
    );
  });

  it('deve rejeitar um responsibleUserId invalido antes de consultar o usuário', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: '',
      documentsIds: 'doc-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      new BusinessRuleError('O responsibleUserId não pode estar vazio'),
    );
  });

  it('deve rejeitar um documentsIds invalido', async () => {
    const input = {
      productId: 'prod-001',
      responsibleUserId: 'user-001',
      documentsIds: '',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      new BusinessRuleError('O documentsIds não pode estar vazio'),
    );
  });
});
