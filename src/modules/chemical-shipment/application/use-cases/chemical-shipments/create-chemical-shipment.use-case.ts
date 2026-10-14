import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ChemicalShipment,
  type CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class CreateChemicalShipmentUseCase {
  private readonly logger = new Logger(CreateChemicalShipmentUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(input: CreateChemicalShipmentData): Promise<ChemicalShipment> {
    try {
      // A entidade valida os dados antes de qualquer consulta.
      const chemicalShipment = ChemicalShipment.create(input);

      const user = await this.users.findById(chemicalShipment.responsibleUserId);
      if (!user) {
        throw new ResourceNotFoundError(
          'Usuário',
          chemicalShipment.responsibleUserId,
        );
      }

      return await this.chemicalShipments.create(chemicalShipment);
    } catch (error) {
      this.logger.error(
        `Erro ao executar criação da carga química: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
