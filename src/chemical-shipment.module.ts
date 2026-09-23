import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from '@/presentation/controllers/chemical-shipment.controller.js';
import { CreateChemicalShipmentUseCase } from '@/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { ChemicalShipmentRepository } from '@/infrastructure/repositories/chemical-shipment.repository.js';

@Module({
  imports: [],
  controllers: [ChemicalShipmentController],
  providers: [CreateChemicalShipmentUseCase, ChemicalShipmentRepository],
})
export class ChemicalShipmentModule {}
