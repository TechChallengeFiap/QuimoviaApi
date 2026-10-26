import type {
  ShipmentDocument,
  ShipmentDocumentProperties,
} from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type { UserSummary } from '@/modules/user/public/index.js';
import type { ShipmentDocumentPage } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';

export interface ShipmentDocumentDetails extends ShipmentDocumentProperties {
  responsibleUser: UserSummary | null;
}

export interface ShipmentDocumentDetailsPage extends Omit<
  ShipmentDocumentPage,
  'items'
> {
  items: ShipmentDocumentDetails[];
}

export function toShipmentDocumentDetails(
  document: ShipmentDocument,
  user: UserSummary | null,
): ShipmentDocumentDetails {
  return {
    ...document.toObject(),
    responsibleUser: user ? { id: user.id, name: user.name } : null,
  };
}
