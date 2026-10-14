import {
  ChemicalShipment,
  CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';

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
      this.validateInput(input);

      const user = await this.users.findById(input.responsibleUserId);
      if (!user) {
        throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
      }

      const chemicalShipment = ChemicalShipment.create(input);
      return await this.chemicalShipments.create(chemicalShipment);
    } catch (error) {
      this.logger.error(
        `Erro ao executar criação da carga química: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private validateInput(input: CreateChemicalShipmentData): void {
    if (!input.productId) {
      throw new BadRequestException('O productId não pode estar vazio');
    }

    if (!input.responsibleUserId) {
      throw new BadRequestException('O responsibleUserId não pode estar vazio');
    }

    if (!input.documentsIds) {
      throw new BadRequestException('O documentsIds não pode estar vazio');
    }
  }
}
