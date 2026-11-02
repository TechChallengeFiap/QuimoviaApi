import { Inject, Injectable } from '@nestjs/common';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import {
  toShipmentDocumentDetails,
  type ShipmentDocumentDetailsPage,
} from '../../dto/shipment-document-details.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type {
  ShipmentDocumentRepository,
  ShipmentDocumentSearchFilters,
} from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export type ListShipmentDocumentsInput = Partial<ShipmentDocumentSearchFilters>;

@Injectable()
export class ListShipmentDocumentsUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
    @Inject(USER_DIRECTORY) private readonly users: UserDirectory,
  ) {}

  async execute(
    input: ListShipmentDocumentsInput = {},
  ): Promise<ShipmentDocumentDetailsPage> {
    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.documents.list({
      shipmentId: input.shipmentId?.toLowerCase(),
      shipperId: input.shipperId?.toLowerCase(),
      status: input.status,
      page,
      pageSize,
    });
    const ids = [
      ...new Set(
        result.items.flatMap((document) =>
          document.responsibleUserId ? [document.responsibleUserId] : [],
        ),
      ),
    ];
    const users = ids.length ? await this.users.findByIds(ids) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    return {
      ...result,
      items: result.items.map((document) =>
        toShipmentDocumentDetails(
          document,
          byId.get(document.responsibleUserId ?? '') ?? null,
        ),
      ),
    };
  }
}
