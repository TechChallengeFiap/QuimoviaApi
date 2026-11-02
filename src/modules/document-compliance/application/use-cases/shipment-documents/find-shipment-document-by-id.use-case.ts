import { Inject, Injectable } from '@nestjs/common';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import {
  toShipmentDocumentDetails,
  type ShipmentDocumentDetails,
} from '../../dto/shipment-document-details.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class FindShipmentDocumentByIdUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
    @Inject(USER_DIRECTORY) private readonly users: UserDirectory,
  ) {}

  async execute(id: string): Promise<ShipmentDocumentDetails> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    const user = document.responsibleUserId
      ? await this.users.findById(document.responsibleUserId)
      : null;
    return toShipmentDocumentDetails(document, user);
  }
}
