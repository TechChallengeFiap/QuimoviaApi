import {
  ChemicalShipmentVO,
  CreateChemicalShipmentVO,
} from '@/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { ChemicalShipmentRepository } from '@/infrastructure/repositories/chemical-shipment.repository.js';
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
