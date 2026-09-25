import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.ts';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from './repositories/chemical-shipment.repository.ts';
import { PrismaChemicalShipmentRepository } from './infrastructure/persistence/prisma/prisma-chemical-shipment.repository.ts';

@Module({
  imports: [],
  controllers: [ChemicalShipmentController],
  providers: [
    CreateChemicalShipmentUseCase, 
    {provide: CHEMICAL_SHIPMENT_REPOSITORY, useClass: PrismaChemicalShipmentRepository }
  ],
})
export class ChemicalShipmentModule {}
