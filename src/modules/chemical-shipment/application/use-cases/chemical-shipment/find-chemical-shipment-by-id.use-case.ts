import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.ts';

@Injectable()
export class FindChemicalShipmentByIdUseCase {
  private readonly logger = new Logger(FindChemicalShipmentByIdUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
  ) {}

  async execute(id: string): Promise<ChemicalShipment> {
    try {
      const chemicalShipment = await this.chemicalShipments.findById(id);

      if (!chemicalShipment) {
        throw new ResourceNotFoundError('Carga Química', id);
      }

      return chemicalShipment;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar carga química por ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
