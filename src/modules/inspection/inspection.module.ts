import { Module } from '@nestjs/common';
import { CreateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/create-inspection.use-case.js';
import { DeleteInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/delete-inspection.use-case.js';
import { FindInspectionByIdUseCase } from '@/modules/inspection/application/use-cases/inspections/find-inspection-by-id.use-case.js';
import { ListInspectionsUseCase } from '@/modules/inspection/application/use-cases/inspections/list-inspections.use-case.js';
import { UpdateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/update-inspection.use-case.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import { PrismaInspectionRepository } from '@/modules/inspection/infrastructure/persistence/prisma/prisma-inspection.repository.js';
import { InspectionsController } from '@/modules/inspection/presentation/controllers/inspections.controller.js';

@Module({
  controllers: [InspectionsController],
  providers: [
    CreateInspectionUseCase,
    ListInspectionsUseCase,
    FindInspectionByIdUseCase,
    UpdateInspectionUseCase,
    DeleteInspectionUseCase,
    { provide: INSPECTION_REPOSITORY, useClass: PrismaInspectionRepository },
  ],
})
export class InspectionModule {}
