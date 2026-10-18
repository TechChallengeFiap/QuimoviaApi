import { Inject, Injectable } from '@nestjs/common';
import type {
  ShipmentDocument,
  UpdateShipmentDocumentData,
} from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

export type UpdateShipmentDocumentInput = UpdateShipmentDocumentData;

@Injectable()
export class UpdateShipmentDocumentUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateShipmentDocumentInput,
  ): Promise<ShipmentDocument> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    document.revise(input);
    return this.documents.update(document);
  }
}
