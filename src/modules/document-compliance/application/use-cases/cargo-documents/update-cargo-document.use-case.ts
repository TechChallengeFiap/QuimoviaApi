import { Inject, Injectable } from '@nestjs/common';
import type {
  CargoDocument,
  UpdateCargoDocumentData,
} from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CARGO_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import type { CargoDocumentRepository } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

export type UpdateCargoDocumentInput = UpdateCargoDocumentData;

@Injectable()
export class UpdateCargoDocumentUseCase {
  constructor(
    @Inject(CARGO_DOCUMENT_REPOSITORY)
    private readonly documents: CargoDocumentRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateCargoDocumentInput,
  ): Promise<CargoDocument> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    document.revise(input);
    return this.documents.update(document);
  }
}
