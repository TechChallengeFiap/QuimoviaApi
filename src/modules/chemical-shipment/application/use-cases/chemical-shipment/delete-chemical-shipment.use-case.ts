import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { ChemicalShipmentActionActor } from './create-chemical-shipment.use-case.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class DeleteChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipment: ChemicalShipmentRepository,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly users?: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, actor?: ChemicalShipmentActionActor | null): Promise<void> {
    const chemicalShipment = await this.chemicalShipment.findById(id);

    if (!chemicalShipment) {
      throw new ResourceNotFoundError('Carga química', id);
    }

    await this.chemicalShipment.delete(id);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id && this.users) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? chemicalShipment.responsibleUserId;
      const resolvedActorName = actorName ?? 'Operador';

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_SHIPMENT,
        entityId: chemicalShipment.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.DELETED,
        description: `Usuário "${resolvedActorName}" removeu a carga química "${chemicalShipment.id}"`,
        details: { shipmentId: chemicalShipment.id },
      });
    }
  }
}
