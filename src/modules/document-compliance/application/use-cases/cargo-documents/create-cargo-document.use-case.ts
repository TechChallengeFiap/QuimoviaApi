import { Inject, Injectable } from '@nestjs/common';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import type { CreateCargoDocumentData } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import type { CargoDocumentRepository } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';

export type CreateCargoDocumentInput = CreateCargoDocumentData;

@Injectable()
export class CreateCargoDocumentUseCase {
  constructor(
    @Inject(CARGO_DOCUMENT_REPOSITORY)
    private readonly documents: CargoDocumentRepository,
  ) {}

  async execute(input: CreateCargoDocumentInput): Promise<CargoDocument> {
    const document = CargoDocument.create(input);
    if (await this.documents.findByCargoId(document.cargoId)) {
      throw new ConflictError(
        'Já existe documentação cadastrada para esta carga.',
      );
    }
    return this.documents.create(document);
  }
}
