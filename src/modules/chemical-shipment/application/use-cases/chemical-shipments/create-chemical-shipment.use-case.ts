import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChemicalShipmentDetails } from '@/modules/chemical-shipment/application/dto/chemical-shipment-details.dto.js';
import {
  ChemicalShipment,
  type CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class CreateChemicalShipmentUseCase {
  private readonly logger = new Logger(CreateChemicalShipmentUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(USER_DIRECTORY)
    private readonly users: UserDirectory,
  ) {}

  async execute(
    input: CreateChemicalShipmentData,
  ): Promise<ChemicalShipmentDetails> {
    try {
      // A entidade valida os dados antes de qualquer consulta.
      const chemicalShipment = ChemicalShipment.create(input);

      const responsibleUser = await this.users.findById(
        chemicalShipment.responsibleUserId,
      );
      if (!responsibleUser) {
        throw new ResourceNotFoundError(
          'Usuário',
          chemicalShipment.responsibleUserId,
        );
      }

      const shipment = await this.chemicalShipments.create(chemicalShipment);

      return { shipment, responsibleUser };
    } catch (error) {
      this.logger.error(
        `Erro ao executar criação da carga química: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
