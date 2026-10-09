/**
 * Escopo avaliado pela inspeção: a carga inteira ou um item específico da sua
 * composição. Cada inspeção possui um único escopo.
 */
export enum InspectionScope {
  CARGO = 'CARGO',
  CARGO_ITEM = 'CARGO_ITEM',
}

export const INSPECTION_SCOPES = Object.values(InspectionScope);
