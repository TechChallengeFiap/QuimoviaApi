import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChemicalShipmentDetails } from '@/modules/chemical-shipment/application/dto/chemical-shipment-details.dto.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class FindChemicalShipmentByIdUseCase {
  private readonly logger = new Logger(FindChemicalShipmentByIdUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(USER_DIRECTORY)
    private readonly users: UserDirectory,
  ) {}

  async execute(id: string): Promise<ChemicalShipmentDetails> {
    try {
      const shipment = await this.chemicalShipments.findById(id);

      if (!shipment) {
        throw new ResourceNotFoundError('Carga química', id);
      }

      const responsibleUser = await this.users.findById(
        shipment.responsibleUserId,
      );

      return { shipment, responsibleUser };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar carga química por ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
