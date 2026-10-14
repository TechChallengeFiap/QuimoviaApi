import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/delete-chemical-shipment.use-case.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { buildChemicalShipment } from '../../mocks/entities.mock.js';

describe('DeleteChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let useCase: DeleteChemicalShipmentUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    chemicalShipments = new ChemicalShipmentMock();
    useCase = new DeleteChemicalShipmentUseCase(chemicalShipments);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve lançar ResourceNotFoundError quando a carga química não for encontrada', async () => {
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('deve remover a carga química quando encontrada', async () => {
    const shipment = await chemicalShipments.create(
      buildChemicalShipment(),
    );

    await useCase.execute(shipment.id);

    await expect(chemicalShipments.findById(shipment.id)).resolves.toBeNull();
  });

  it('registra o erro no log e o propaga quando a remoção falha', async () => {
    const shipment = await chemicalShipments.create(
      buildChemicalShipment(),
    );
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(chemicalShipments, 'delete').mockRejectedValueOnce(failure);

    await expect(useCase.execute(shipment.id)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao remover a carga química com id ${shipment.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
