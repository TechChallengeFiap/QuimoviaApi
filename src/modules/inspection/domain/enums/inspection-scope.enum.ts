/**
 * Escopo avaliado pela inspeção: a carga inteira ou um item específico da sua
 * composição. Cada inspeção possui um único escopo.
 */
export enum InspectionScope {
  SHIPMENT = 'SHIPMENT',
  SHIPMENT_ITEM = 'SHIPMENT_ITEM',
}

export const INSPECTION_SCOPES = Object.values(InspectionScope);
