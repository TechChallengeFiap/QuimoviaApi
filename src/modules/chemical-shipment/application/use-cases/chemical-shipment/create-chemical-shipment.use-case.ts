import {
  ChemicalShipment,
  CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';
import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';

@Injectable()
export class CreateChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY) private readonly chemicalShipments: ChemicalShipmentRepository,
  ) {}

  async execute(
    input: CreateChemicalShipmentData,
  ): Promise<ChemicalShipment> {
    const chemicalShipment = ChemicalShipment.create(input);
    return this.chemicalShipments.create(chemicalShipment);
  }
}
