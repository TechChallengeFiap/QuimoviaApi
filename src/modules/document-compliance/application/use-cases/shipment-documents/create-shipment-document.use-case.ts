import { Inject, Injectable, Optional } from '@nestjs/common';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type { CreateShipmentDocumentData } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { SHIPMENT_DOCUMENT_REPOSITORY } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import type { ShipmentDocumentRepository } from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import {
  USER_DIRECTORY,
  type UserDirectory,
} from '@/modules/user/public/index.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import {
  AUDIT_LOG_RECORDER,
  AuditAction,
  AuditedEntity,
  type AuditLogRecorder,
} from '@/modules/audit-log/public/index.js';
import {
  toShipmentDocumentDetails,
  type ShipmentDocumentDetails,
} from '../../dto/shipment-document-details.js';

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
    @Inject(USER_DIRECTORY)
    private readonly users: UserDirectory,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    input: CreateShipmentDocumentInput,
    actor?: ShipmentDocumentActionActor | null,
  ): Promise<ShipmentDocumentDetails> {
    const document = ShipmentDocument.create(input);
    const responsibleUser = document.responsibleUserId
      ? await this.users.findById(document.responsibleUserId)
      : null;
    if (document.responsibleUserId !== null && !responsibleUser) {
      throw new ResourceNotFoundError(
        'Responsável técnico',
        document.responsibleUserId,
      );
    }
    if (await this.documents.findByShipmentId(document.shipmentId)) {
      throw new ConflictError(
        'Já existe documentação cadastrada para esta carga.',
      );
    }
    const created = await this.documents.create(document);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id) {
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

    return toShipmentDocumentDetails(created, responsibleUser);
  }
}
