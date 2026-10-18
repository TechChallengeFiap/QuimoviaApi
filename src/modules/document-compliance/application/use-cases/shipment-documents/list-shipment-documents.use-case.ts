import { Inject, Injectable } from '@nestjs/common';
import type { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type {
  ShipmentDocumentPage,
  ShipmentDocumentRepository,
} from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListShipmentDocumentsInput {
  shipmentId?: string;
  shipperId?: string;
  status?: ShipmentDocumentStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListShipmentDocumentsUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
  ) {}

  async execute(
    input: ListShipmentDocumentsInput = {},
  ): Promise<ShipmentDocumentPage> {
    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)
    ) {
      throw new BusinessRuleError(
        'Informe uma página válida e entre 1 e 100 registros por página.',
      );
    }
    return this.documents.list({
      shipmentId: input.shipmentId?.toLowerCase(),
      shipperId: input.shipperId?.toLowerCase(),
      status: input.status,
      page,
      pageSize,
    });
  }
}
