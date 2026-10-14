import { Module } from '@nestjs/common';
import { CreateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/create-chemical-shipment.use-case.js';
import { DeleteChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/delete-chemical-shipment.use-case.js';
import { FindChemicalShipmentByIdUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/find-chemical-shipment-by-id.use-case.js';
import { ListChemicalShipmentsUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/list-chemical-shipments.use-case.js';
import { UpdateChemicalShipmentUseCase } from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/update-chemical-shipment.use-case.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { PrismaChemicalShipmentRepository } from '@/modules/chemical-shipment/infrastructure/persistence/prisma/prisma-chemical-shipment.repository.js';
import { ChemicalShipmentController } from '@/modules/chemical-shipment/presentation/controllers/chemical-shipment.controller.js';
import { UserModule } from '@/modules/user/public/index.js';
import { PrismaModule } from '@/shared/infrastructure/persistence/prisma/prisma.module.js';

/**
 * Módulo do contexto Gestão de Cargas.
 *
 * Depende de Identidade e Acesso apenas pela API pública daquele contexto: o
 * UserModule fornece o contrato USER_DIRECTORY usado pelos casos de uso.
 * Não exporta nada.
 */
@Module({
  imports: [PrismaModule, UserModule],
  controllers: [ChemicalShipmentController],
  providers: [
    CreateChemicalShipmentUseCase,
    ListChemicalShipmentsUseCase,
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
