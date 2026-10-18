import { Inject, Injectable } from '@nestjs/common';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type { CreateShipmentDocumentData } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';

export type CreateShipmentDocumentInput = CreateShipmentDocumentData;

@Injectable()
export class CreateShipmentDocumentUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
  ) {}

  async execute(input: CreateShipmentDocumentInput): Promise<ShipmentDocument> {
    const document = ShipmentDocument.create(input);
    if (await this.documents.findByShipmentId(document.shipmentId)) {
      throw new ConflictError(
        'Já existe documentação cadastrada para esta carga.',
      );
    }
    return this.documents.create(document);
  }
}
