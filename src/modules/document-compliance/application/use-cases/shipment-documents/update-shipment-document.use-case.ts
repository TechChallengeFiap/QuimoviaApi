import { Inject, Injectable, Optional } from '@nestjs/common';
import type { UpdateShipmentDocumentData } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import {
  AUDIT_LOG_RECORDER,
  AuditAction,
  AuditedEntity,
  type AuditLogRecorder,
} from '@/modules/audit-log/public/index.js';
import type { ShipmentDocumentActionActor } from './create-shipment-document.use-case.js';
import {
  toShipmentDocumentDetails,
  type ShipmentDocumentDetails,
} from '../../dto/shipment-document-details.js';

export type UpdateShipmentDocumentInput = UpdateShipmentDocumentData;

@Injectable()
export class UpdateShipmentDocumentUseCase {
  constructor(
    @Inject(SHIPMENT_DOCUMENT_REPOSITORY)
    private readonly documents: ShipmentDocumentRepository,
    @Inject(USER_DIRECTORY)
    private readonly users: UserDirectory,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    id: string,
    input: UpdateShipmentDocumentInput,
    actor?: ShipmentDocumentActionActor | null,
  ): Promise<ShipmentDocumentDetails> {
    const document = await this.documents.findById(id.toLowerCase());
    if (!document) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    document.ensureEditable();
    const responsibleUserId =
      input.responsibleUserId?.toLowerCase() ?? document.responsibleUserId;
    const responsibleUser = responsibleUserId
      ? await this.users.findById(responsibleUserId)
      : null;
    if (input.responsibleUserId !== undefined && !responsibleUser) {
      throw new ResourceNotFoundError(
        'Responsável técnico',
        input.responsibleUserId.toLowerCase(),
      );
    }
    document.revise(input);
    const updated = await this.documents.update(document);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? updated.shipperId;
      const resolvedActorName = actorName ?? 'Embarcador';

      await this.auditLogs.record({
        entityType: AuditedEntity.SHIPMENT_DOCUMENT,
        entityId: updated.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.UPDATED,
        description: `Usuário "${resolvedActorName}" revisou os documentos de conformidade da carga "${updated.shipmentId}"`,
        details: {
          shipmentId: updated.shipmentId,
          revision: updated.revision,
          status: updated.status,
        },
      });
    }

    return toShipmentDocumentDetails(updated, responsibleUser);
  }
}
