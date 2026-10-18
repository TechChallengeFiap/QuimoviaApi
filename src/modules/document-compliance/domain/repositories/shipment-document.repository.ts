import type { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';

export interface ShipmentDocumentSearchFilters {
  shipmentId?: string;
  shipperId?: string;
  status?: ShipmentDocumentStatus;
  page: number;
  pageSize: number;
}

export interface ShipmentDocumentPage {
  items: ShipmentDocument[];
  total: number;
  page: number;
  pageSize: number;
}

/** Contrato de persistência do agregado, incluindo seus anexos. */
export interface ShipmentDocumentRepository {
  create(document: ShipmentDocument): Promise<ShipmentDocument>;
  update(document: ShipmentDocument): Promise<ShipmentDocument>;
  remove(id: string, revision: number): Promise<void>;
  findById(id: string): Promise<ShipmentDocument | null>;
  findByShipmentId(shipmentId: string): Promise<ShipmentDocument | null>;
  list(filters: ShipmentDocumentSearchFilters): Promise<ShipmentDocumentPage>;
}

export const SHIPMENT_DOCUMENT_REPOSITORY = Symbol(
  'ShipmentDocumentRepository',
);
