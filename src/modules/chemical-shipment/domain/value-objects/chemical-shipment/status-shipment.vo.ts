export const StatusShipment = {
  ANALYZING: 'ANALYZING',
  INSPECTION: 'INSPECTION',
  APPROVED: 'APPROVED',
  REPROVED: 'REPROVED',
  BLOCKED: 'BLOCKED',
  RELEASED: 'RELEASED',
} as const;

export type StatusShipment =
  (typeof StatusShipment)[keyof typeof StatusShipment];
