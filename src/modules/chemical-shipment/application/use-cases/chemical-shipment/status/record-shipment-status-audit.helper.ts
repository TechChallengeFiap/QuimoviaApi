import type { AuditLogRecorder } from '@/modules/audit-log/public/index.js';
import { AuditAction, AuditedEntity } from '@/modules/audit-log/public/index.js';
import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import {
  STATUS_SHIPMENT_LABELS,
  type StatusShipment,
} from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import type { ChemicalShipmentActionActor } from '../create-chemical-shipment.use-case.js';

export async function recordShipmentStatusAudit(params: {
  shipment: ChemicalShipment;
  from: StatusShipment;
  actor?: ChemicalShipmentActionActor | null;
  users: UserRepository;
  auditLogs?: AuditLogRecorder;
}): Promise<void> {
  const { shipment, from, actor, users, auditLogs } = params;
  if (!auditLogs) return;

  let actorName = actor?.name;
  if (!actorName && actor?.id) {
    const user = await users.findById(actor.id);
    actorName = user?.name;
  }
  const resolvedActorName = actorName ?? 'Operador';
  const actorId = actor?.id ?? shipment.responsibleUserId;
  const label = STATUS_SHIPMENT_LABELS;

  await auditLogs.record({
    entityType: AuditedEntity.CHEMICAL_SHIPMENT,
    entityId: shipment.id,
    actorId,
    actorName: resolvedActorName,
    action: AuditAction.STATUS_CHANGED,
    description: `Usuário "${resolvedActorName}" alterou o status da carga química "${shipment.id}" de "${label[from]}" para "${label[shipment.status]}"`,
    details: {
      from,
      to: shipment.status,
    },
  });
}
