import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/update-chemical-shipment.use-case.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalShipmentRepositoryMock } from '../../mocks/chemical-shipment-repository.mock.js';
import {
  UserDirectoryMock,
  userSummary,
} from '../../mocks/user-directory.mock.js';
import { buildChemicalShipment } from '../../mocks/entities.mock.js';

describe('UpdateChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentRepositoryMock;
  let useCase: UpdateChemicalShipmentUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    chemicalShipments = new ChemicalShipmentRepositoryMock();
    useCase = new UpdateChemicalShipmentUseCase(
      chemicalShipments,
      new UserDirectoryMock([
        userSummary({ id: 'user-001', name: 'Operador Teste' }),
        userSummary({ id: 'user-002', name: 'Segundo Operador' }),
      ]),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function createSampleShipment(
    status: StatusShipment = StatusShipment.ANALYZING,
  ): Promise<ChemicalShipment> {
    const shipment = buildChemicalShipment();
    if (status !== StatusShipment.ANALYZING) {
      shipment.changeStatus(status);
    }
    return chemicalShipments.create(shipment);
  }

  it('atualiza a carga química com sucesso incluindo o usuário responsável existente', async () => {
    const shipment = await createSampleShipment();

    const { shipment: updated, responsibleUser } = await useCase.execute(
      shipment.id,
      {
        productId: 'prod-002',
        responsibleUserId: 'user-002',
        documentsIds: 'doc-002',
        status: StatusShipment.INSPECTION,
      },
    );

    expect(updated.productId).toBe('prod-002');
    expect(updated.responsibleUserId).toBe('user-002');
    expect(updated.documentsIds).toBe('doc-002');
    expect(updated.status).toBe(StatusShipment.INSPECTION);
    expect(responsibleUser?.name).toBe('Segundo Operador');
  });

  it('devolve o responsável atual quando ele não é alterado', async () => {
    const shipment = await createSampleShipment();

    const { responsibleUser } = await useCase.execute(shipment.id, {
      productId: 'prod-002',
    });

    expect(responsibleUser?.id).toBe('user-001');
  });

  it('deve lançar ResourceNotFoundError quando a carga química não for encontrada', async () => {
    await expect(
      useCase.execute('shipment-inexistente', {
        productId: 'prod-002',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao atualizar a carga química com id shipment-inexistente: Carga química não encontrado(a) para o identificador "shipment-inexistente".',
      expect.any(String),
    );
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
