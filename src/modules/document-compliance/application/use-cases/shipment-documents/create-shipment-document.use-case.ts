import { Inject, Injectable, Optional } from '@nestjs/common';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type { CreateShipmentDocumentData } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';

export type CreateShipmentDocumentInput = CreateShipmentDocumentData;

export interface ShipmentDocumentActionActor {
  id: string;
  name?: string;
}

@Injectable()
export class CreateShipmentDocumentUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly users?: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    input: CreateShipmentDocumentInput,
    actor?: ShipmentDocumentActionActor | null,
  ): Promise<ShipmentDocument> {
    const document = ShipmentDocument.create(input);
    if (await this.documents.findByShipmentId(document.shipmentId)) {
      throw new ConflictError(
        'Já existe documentação cadastrada para esta carga.',
      );
    }
    const created = await this.documents.create(document);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id && this.users) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? created.shipperId;
      const resolvedActorName = actorName ?? 'Embarcador';

      await this.auditLogs.record({
        entityType: AuditedEntity.SHIPMENT_DOCUMENT,
        entityId: created.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.CREATED,
        description: `Usuário "${resolvedActorName}" cadastrou o documento de conformidade para a carga "${created.shipmentId}"`,
        details: {
          shipmentId: created.shipmentId,
          status: created.status,
          revision: created.revision,
        },
      });
    }

    return created;
  }
}
