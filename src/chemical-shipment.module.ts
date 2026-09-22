import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from './presentation/controllers/chemical-shipment.controller.ts';
import { CreateChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { ChemicalShipmentRepository } from './infrastructure/repositories/chemical-shipment.repository.ts';

@Module({
  imports: [],
  controllers: [ChemicalShipmentController],
  providers: [CreateChemicalShipmentUseCase, ChemicalShipmentRepository],
})
export class ChemicalShipmentModule {}
