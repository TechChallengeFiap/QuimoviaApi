import { Inject, Injectable } from '@nestjs/common';
import {
  SHIPMENT_DOCUMENT_REPOSITORY,
  type ShipmentDocumentRepository,
} from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentationChecker } from '@/modules/document-compliance/public/shipment-documentation-checker.contract.js';

@Injectable()
export class CheckShipmentDocumentationUseCase implements ShipmentDocumentationChecker {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
  ) {}

  async hasRequiredDocumentation(shipmentId: string): Promise<boolean> {
    const document = await this.documents.findByShipmentId(
      shipmentId.toLowerCase(),
    );
    return document?.isSufficientForRelease() ?? false;
  }
}
