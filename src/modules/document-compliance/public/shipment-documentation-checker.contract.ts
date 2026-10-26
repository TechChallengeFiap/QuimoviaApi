export interface ShipmentDocumentationChecker {
  hasRequiredDocumentation(shipmentId: string): Promise<boolean>;
}
export const SHIPMENT_DOCUMENTATION_CHECKER = Symbol(
  'ShipmentDocumentationChecker',
);
