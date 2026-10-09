import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.ts';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts';
import { CHEMICAL_SHIPMENT_REPOSITORY } from './domain/repositories/chemical-shipment.repository.ts';
import { PrismaChemicalShipmentRepository } from './infrastructure/persistence/prisma/prisma-chemical-shipment.repository.ts';
import { ListChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/list-chemical-shipment.use-case.ts';
import { FindChemicalShipmentByIdUseCase } from './application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.ts';
import { UpdateChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/update-chemical-shipment.use-case.ts';
import { DeleteChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.ts';

import { UserModule } from '@/modules/user/user.module.ts';

@Module({
  imports: [UserModule],
  controllers: [ChemicalShipmentController],
  providers: [
    CreateChemicalShipmentUseCase,
    ListChemicalShipmentUseCase,
    FindChemicalShipmentByIdUseCase,
    UpdateChemicalShipmentUseCase,
    DeleteChemicalShipmentUseCase,
    {
      provide: CHEMICAL_SHIPMENT_REPOSITORY,
      useClass: PrismaChemicalShipmentRepository,
    },
  ],
})
export class ChemicalShipmentModule {}
