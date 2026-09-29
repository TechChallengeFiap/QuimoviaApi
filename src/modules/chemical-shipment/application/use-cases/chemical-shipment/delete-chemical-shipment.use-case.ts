import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';
import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';

@Injectable()
export class DeleteChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipment: ChemicalShipmentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const chemicalShipment = await this.chemicalShipment.findById(id);

    if (!chemicalShipment) {
      throw new ResourceNotFoundError('Carga química', id);
    }

    await this.chemicalShipment.delete(id);
  }
}
