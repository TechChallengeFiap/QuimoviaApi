import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.ts';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.ts';

describe('DeleteChemicalShipmentUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let useCase: DeleteChemicalShipmentUseCase;

  beforeEach(() => {
    chemicalShipments = new ChemicalShipmentMock();
    useCase = new DeleteChemicalShipmentUseCase(chemicalShipments);
  });

  it('deve lançar ResourceNotFoundError quando a carga química não for encontrada', async () => {
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('deve remover a carga química quando encontrada', async () => {
    const shipment = await chemicalShipments.create(
      ChemicalShipment.create({
        productId: 'prod-001',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
      }),
    );

    await useCase.execute(shipment.id);

    await expect(chemicalShipments.findById(shipment.id)).resolves.toBeNull();
  });
});
