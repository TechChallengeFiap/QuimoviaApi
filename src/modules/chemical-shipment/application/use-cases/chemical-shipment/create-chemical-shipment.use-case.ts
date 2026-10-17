import {
  ChemicalShipment,
  CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';

@Injectable()
export class CreateChemicalShipmentUseCase {
  private readonly logger = new Logger(CreateChemicalShipmentUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipmentRepository: ChemicalShipmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly chemicalProductRepository: ChemicalProductRepository,
  ) {}

  async execute(input: CreateChemicalShipmentData): Promise<ChemicalShipment> {
    try {
      await this.validateInput(input);

      const chemicalShipment = ChemicalShipment.create(input);
      return await this.chemicalShipmentRepository.create(chemicalShipment);
    } catch (error) {
      this.logger.error(
        `Erro ao executar criação da carga química: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async validateInput(
    input: CreateChemicalShipmentData,
  ): Promise<void> {
    const responsibleUser = await this.userRepository.findById(
      input.responsibleUserId,
    );
    if (!responsibleUser) {
      throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
    }

    const chemicalProduct = await this.chemicalProductRepository.findById(
      input.productId,
    );
    if (!chemicalProduct) {
      throw new ResourceNotFoundError('Produto Químico', input.productId);
    }
  }
}
