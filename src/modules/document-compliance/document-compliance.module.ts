import { Module } from '@nestjs/common';
import { UserModule } from '@/modules/user/user.module.js';
import { CreateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/create-shipment-document.use-case.js';
import { DeleteShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/delete-shipment-document.use-case.js';
import { FindShipmentDocumentByIdUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/find-shipment-document-by-id.use-case.js';
import { ListShipmentDocumentsUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/list-shipment-documents.use-case.js';
import { UpdateShipmentDocumentUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/update-shipment-document.use-case.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { PrismaShipmentDocumentRepository } from '@/modules/document-compliance/infrastructure/persistence/prisma/prisma-shipment-document.repository.js';
import { ShipmentDocumentsController } from '@/modules/document-compliance/presentation/controllers/shipment-documents.controller.js';

@Module({
  imports: [UserModule],
  controllers: [ShipmentDocumentsController],
  providers: [
    CreateShipmentDocumentUseCase,
    FindShipmentDocumentByIdUseCase,
    ListShipmentDocumentsUseCase,
    UpdateShipmentDocumentUseCase,
    DeleteShipmentDocumentUseCase,
    {
      provide: SHIPMENT_DOCUMENT_REPOSITORY,
      useClass: PrismaShipmentDocumentRepository,
    },
  ],
})
export class DocumentComplianceModule {}
