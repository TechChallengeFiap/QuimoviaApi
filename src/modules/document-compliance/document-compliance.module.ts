import { Module } from '@nestjs/common';
import { CreateCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/create-cargo-document.use-case.js';
import { DeleteCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/delete-cargo-document.use-case.js';
import { FindCargoDocumentByIdUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/find-cargo-document-by-id.use-case.js';
import { ListCargoDocumentsUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/list-cargo-documents.use-case.js';
import { UpdateCargoDocumentUseCase } from '@/modules/document-compliance/application/use-cases/cargo-documents/update-cargo-document.use-case.js';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { PrismaCargoDocumentRepository } from '@/modules/document-compliance/infrastructure/persistence/prisma/prisma-cargo-document.repository.js';
import { CargoDocumentsController } from '@/modules/document-compliance/presentation/controllers/cargo-documents.controller.js';

@Module({
  controllers: [CargoDocumentsController],
  providers: [
    CreateCargoDocumentUseCase,
    FindCargoDocumentByIdUseCase,
    ListCargoDocumentsUseCase,
    UpdateCargoDocumentUseCase,
    DeleteCargoDocumentUseCase,
    {
      provide: CARGO_DOCUMENT_REPOSITORY,
      useClass: PrismaCargoDocumentRepository,
    },
  ],
})
export class DocumentComplianceModule {}
