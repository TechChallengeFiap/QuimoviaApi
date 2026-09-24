import {
  ChemicalShipmentVO,
  CreateChemicalShipmentVO,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import { ChemicalShipmentRepository } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateChemicalShipmentUseCase {
  constructor(
    private readonly chemicalShipmentRepository: ChemicalShipmentRepository,
  ) {}

  async execute(
    chemicalShipment: CreateChemicalShipmentVO,
  ): Promise<ChemicalShipmentVO> {
    return this.chemicalShipmentRepository.create(chemicalShipment);
  }
}
