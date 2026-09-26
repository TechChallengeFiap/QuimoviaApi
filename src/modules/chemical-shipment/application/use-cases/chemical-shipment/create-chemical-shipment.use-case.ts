import {
  ChemicalShipment,
  CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';

@Injectable()
export class CreateChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY) private readonly chemicalShipments: ChemicalShipmentRepository,
  ) {}

  async execute(
    input: CreateChemicalShipmentData,
  ): Promise<ChemicalShipment> {
    this.validateInput(input);
    const chemicalShipment = ChemicalShipment.create(input);
    return this.chemicalShipments.create(chemicalShipment);
  }

  private validateInput(input: CreateChemicalShipmentData): void {
    if (!input.productId) {
      throw new BadRequestException("O productId não pode estar vazio");
    }

    if (!input.responsibleUserId) {
      throw new BadRequestException("O responsibleUserId não pode estar vazio");
    }

    if (!input.documentsIds) {
      throw new BadRequestException("O documentsIds não pode estar vazio");
    }
  }
}
