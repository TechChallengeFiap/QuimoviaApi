import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.js';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from './domain/repositories/chemical-shipment.repository.js';
import { PrismaChemicalShipmentRepository } from './infrastructure/persistence/prisma/prisma-chemical-shipment.repository.js';
import { ListChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/list-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from './application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.js';
import { UpdateChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.js';

import { UserModule } from '@/modules/user/user.module.js';
import { ChemicalProductsModule } from '../chemical-products/chemical-products.module.js';

@Module({
  imports: [UserModule, ChemicalProductsModule],
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
  exports: [CHEMICAL_SHIPMENT_REPOSITORY],
})
export class ChemicalShipmentModule {}
