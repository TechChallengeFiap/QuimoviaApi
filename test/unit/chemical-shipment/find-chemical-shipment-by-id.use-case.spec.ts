import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/find-chemical-shipment-by-id.use-case.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';

describe('FindChemicalShipmentByIdUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let useCase: FindChemicalShipmentByIdUseCase;

  beforeEach(() => {
    chemicalShipments = new ChemicalShipmentMock();
    useCase = new FindChemicalShipmentByIdUseCase(chemicalShipments);
  });

  it('deve lançar ResourceNotFoundError quando a carga química não for encontrada', async () => {
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('deve retornar a carga química quando encontrada', async () => {
    const shipment = await chemicalShipments.create(
      ChemicalShipment.create({
        productId: 'prod-001',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
      }),
    );

    const result = await useCase.execute(shipment.id);

    expect(result).toBe(shipment);
    expect(result.id).toBe(shipment.id);
  });
});
