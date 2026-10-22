import { Inject, Injectable, Optional } from '@nestjs/common';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { ShipmentDocumentActionActor } from './create-shipment-document.use-case.js';

@Injectable()
export class DeleteShipmentDocumentUseCase {
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

  async execute(id: string, actor?: ShipmentDocumentActionActor | null): Promise<void> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    document.ensureEditable();
    await this.documents.remove(document.id, document.revision);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id && this.users) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? document.shipperId;
      const resolvedActorName = actorName ?? 'Embarcador';

      await this.auditLogs.record({
        entityType: AuditedEntity.SHIPMENT_DOCUMENT,
        entityId: document.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.DELETED,
        description: `Usuário "${resolvedActorName}" removeu a documentação de conformidade "${document.id}" da carga "${document.shipmentId}"`,
        details: {
          shipmentId: document.shipmentId,
          revision: document.revision,
        },
      });
    }
  }
}
