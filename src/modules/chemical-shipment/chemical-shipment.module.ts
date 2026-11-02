import { Module } from '@nestjs/common';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.js';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from './domain/repositories/chemical-shipment.repository.js';
import { PrismaChemicalShipmentRepository } from './infrastructure/persistence/prisma/prisma-chemical-shipment.repository.js';
import { ListChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/list-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from './application/use-cases/chemical-shipment/find-chemical-shipment-by-id.use-case.js';
import { UpdateChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/update-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/delete-chemical-shipment.use-case.js';
import { StartShipmentAnalysisUseCase } from './application/use-cases/chemical-shipment/status/start-shipment-analysis.use-case.js';
import { SendShipmentToInspectionUseCase } from './application/use-cases/chemical-shipment/status/send-shipment-to-inspection.use-case.js';
import { ReleaseChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/status/release-chemical-shipment.use-case.js';
import { BlockChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/status/block-chemical-shipment.use-case.js';
import { StartShipmentTransitUseCase } from './application/use-cases/chemical-shipment/status/start-shipment-transit.use-case.js';
import { CompleteChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/status/complete-chemical-shipment.use-case.js';
import { CancelChemicalShipmentUseCase } from './application/use-cases/chemical-shipment/status/cancel-chemical-shipment.use-case.js';
import { ChangeChemicalShipmentStatusUseCase } from './application/use-cases/chemical-shipment/status/change-chemical-shipment-status.use-case.js';

import { UserModule } from '@/modules/user/user.module.js';
import { AuthModule } from '@/modules/user/auth.module.js';
import { ChemicalProductsModule } from '../chemical-products/chemical-products.module.js';
import { DocumentComplianceModule } from '@/modules/document-compliance/public/index.js';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ChemicalProductsModule,
    DocumentComplianceModule,
  ],
  controllers: [ChemicalShipmentController],
  providers: [
    CreateChemicalShipmentUseCase,
    ListChemicalShipmentUseCase,
    FindChemicalShipmentByIdUseCase,
    UpdateChemicalShipmentUseCase,
    DeleteChemicalShipmentUseCase,
    StartShipmentAnalysisUseCase,
    SendShipmentToInspectionUseCase,
    ReleaseChemicalShipmentUseCase,
    BlockChemicalShipmentUseCase,
    StartShipmentTransitUseCase,
    CompleteChemicalShipmentUseCase,
    CancelChemicalShipmentUseCase,
    ChangeChemicalShipmentStatusUseCase,
    {
      provide: CHEMICAL_SHIPMENT_REPOSITORY,
      useClass: PrismaChemicalShipmentRepository,
    },
  ],
  exports: [CHEMICAL_SHIPMENT_REPOSITORY],
})
export class ChemicalShipmentModule {}
