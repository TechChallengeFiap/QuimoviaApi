import { Inject, Injectable } from '@nestjs/common';
import type { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import type { CargoDocumentRepository } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class FindCargoDocumentByIdUseCase {
  constructor(
    @Inject(CARGO_DOCUMENT_REPOSITORY)
    private readonly documents: CargoDocumentRepository,
  ) {}

  async execute(id: string): Promise<CargoDocument> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    return document;
  }
}
