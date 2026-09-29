import { Inject, Injectable } from '@nestjs/common';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import type { CargoDocumentRepository } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class DeleteCargoDocumentUseCase {
  constructor(
    @Inject(CARGO_DOCUMENT_REPOSITORY)
    private readonly documents: CargoDocumentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    document.ensureEditable();
    await this.documents.remove(document.id, document.revision);
  }
}
