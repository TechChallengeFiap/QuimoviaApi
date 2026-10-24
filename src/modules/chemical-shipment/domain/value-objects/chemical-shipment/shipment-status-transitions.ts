import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import {
  STATUS_SHIPMENT_LABELS as LABEL,
  StatusShipment,
} from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';

const ALLOWED_TRANSITIONS: Readonly<
  Record<StatusShipment, readonly StatusShipment[]>
> = {
  [StatusShipment.REGISTERED]: [
    StatusShipment.ANALYZING,
    StatusShipment.CANCELLED,
  ],
  [StatusShipment.ANALYZING]: [
    StatusShipment.INSPECTION,
    StatusShipment.CANCELLED,
  ],
  [StatusShipment.INSPECTION]: [
    StatusShipment.APPROVED,
    StatusShipment.REPROVED,
    StatusShipment.CANCELLED,
  ],
  [StatusShipment.APPROVED]: [
    StatusShipment.IN_TRANSIT,
    StatusShipment.CANCELLED,
  ],
  [StatusShipment.REPROVED]: [StatusShipment.CANCELLED],
  [StatusShipment.IN_TRANSIT]: [StatusShipment.COMPLETED],
  [StatusShipment.COMPLETED]: [],
  [StatusShipment.CANCELLED]: [],
};

export function allowedTransitionsFrom(
  from: StatusShipment,
): readonly StatusShipment[] {
  return ALLOWED_TRANSITIONS[from];
}

export function isTerminalStatus(status: StatusShipment): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function canTransition(
  from: StatusShipment,
  to: StatusShipment,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransitionAllowed(
  from: StatusShipment,
  to: StatusShipment,
): void {
  if (!canTransition(from, to)) {
    throw new BusinessRuleError(describeForbiddenTransition(from, to));
  }
}

function describeForbiddenTransition(
  from: StatusShipment,
  to: StatusShipment,
): string {
  if (from === StatusShipment.CANCELLED) {
    return to === StatusShipment.APPROVED
      ? 'Uma carga cancelada não pode ser liberada.'
      : 'Uma carga cancelada não pode ser reativada nem sofrer novas alterações de status.';
  }
  if (from === StatusShipment.COMPLETED) {
    return 'Uma carga finalizada não pode sofrer novas alterações de status.';
  }
  if (from === StatusShipment.REPROVED && to === StatusShipment.IN_TRANSIT) {
    return 'Uma carga bloqueada não pode entrar em movimentação.';
  }
  if (from === StatusShipment.INSPECTION && to === StatusShipment.COMPLETED) {
    return 'Uma carga em inspeção não pode ser finalizada sem antes ser liberada.';
  }
  const allowed = ALLOWED_TRANSITIONS[from]
    .map((s) => `"${LABEL[s]}"`)
    .join(', ');
  return `Transição de status inválida: "${LABEL[from]}" → "${LABEL[to]}". A partir de "${LABEL[from]}" são permitidos: ${allowed}.`;
}
