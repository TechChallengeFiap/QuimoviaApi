import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  CHEMICAL_SHIPMENT_REPOSITORY,
  type ChemicalShipmentRepository,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import {
  SHIPMENT_DOCUMENTATION_CHECKER,
  type ShipmentDocumentationChecker,
} from '@/modules/document-compliance/public/index.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/public/index.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import type { ChemicalShipmentActionActor } from '../create-chemical-shipment.use-case.js';
import { recordShipmentStatusAudit } from './record-shipment-status-audit.helper.js';

@Injectable()
export class ReleaseChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(SHIPMENT_DOCUMENTATION_CHECKER)
    private readonly documentation: ShipmentDocumentationChecker,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    id: string,
    actor?: ChemicalShipmentActionActor | null,
  ): Promise<ChemicalShipment> {
    const shipment = await this.chemicalShipments.findById(id);
    if (!shipment || shipment.deletedAt) {
      throw new ResourceNotFoundError('Carga Química', id);
    }

    const hasDocs = await this.documentation.hasRequiredDocumentation(shipment.id);
    const previousStatus = shipment.status;
    shipment.release(hasDocs);
    const updated = await this.chemicalShipments.update(shipment, previousStatus);

    await recordShipmentStatusAudit({
      shipment: updated,
      from: previousStatus,
      actor,
      users: this.users,
      auditLogs: this.auditLogs,
    });

    return updated;
  }
}
