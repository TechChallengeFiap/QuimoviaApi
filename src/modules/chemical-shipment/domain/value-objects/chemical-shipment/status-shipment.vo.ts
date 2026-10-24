export const StatusShipment = {
  REGISTERED: 'REGISTERED',
  ANALYZING: 'ANALYZING',
  INSPECTION: 'INSPECTION',
  APPROVED: 'APPROVED',
  REPROVED: 'REPROVED',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type StatusShipment =
  (typeof StatusShipment)[keyof typeof StatusShipment];

export const STATUS_SHIPMENT_LABELS: Readonly<Record<StatusShipment, string>> =
  {
    [StatusShipment.REGISTERED]: 'Registrada',
    [StatusShipment.ANALYZING]: 'Em análise',
    [StatusShipment.INSPECTION]: 'Em inspeção',
    [StatusShipment.APPROVED]: 'Liberada',
    [StatusShipment.REPROVED]: 'Bloqueada',
    [StatusShipment.IN_TRANSIT]: 'Em movimentação',
    [StatusShipment.COMPLETED]: 'Finalizada',
    [StatusShipment.CANCELLED]: 'Cancelada',
  };
