import { Inject, Injectable, Logger } from '@nestjs/common';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class DeleteChemicalShipmentUseCase {
  private readonly logger = new Logger(DeleteChemicalShipmentUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipment: ChemicalShipmentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const chemicalShipment = await this.chemicalShipment.findById(id);

      if (!chemicalShipment) {
        throw new ResourceNotFoundError('Carga química', id);
      }

      await this.chemicalShipment.delete(id);
    } catch (error) {
      this.logger.error(
        `Erro ao remover a carga química com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
