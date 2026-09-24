import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.ts';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { ChemicalShipmentRepository } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';

@Module({
  imports: [],
  controllers: [ChemicalShipmentController],
  providers: [CreateChemicalShipmentUseCase, ChemicalShipmentRepository],
})
export class ChemicalShipmentModule {}
