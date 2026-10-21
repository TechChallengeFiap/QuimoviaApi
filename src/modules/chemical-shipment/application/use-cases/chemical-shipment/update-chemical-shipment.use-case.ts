import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { ChemicalShipmentActionActor } from './create-chemical-shipment.use-case.js';

export interface UpdateChemicalShipmentInput {
  status?: StatusShipment;
  productId?: string;
  responsibleUserId?: string;
  documentsIds?: string;
  quantityProduct?: number;
}

@Injectable()
export class UpdateChemicalShipmentUseCase {
  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipments: ChemicalShipmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly chemicalProducts: ChemicalProductRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    id: string,
    input: UpdateChemicalShipmentInput,
    actor?: ChemicalShipmentActionActor | null,
  ): Promise<ChemicalShipment> {
    const existingChemicalShipment = await this.chemicalShipments.findById(id);

    if (!existingChemicalShipment) {
      throw new ResourceNotFoundError('Carga Química', id);
    }

    if (input.status) {
      existingChemicalShipment.updateStatus(input.status);
    }

    if (input.productId) {
      const product = await this.chemicalProducts.findById(input.productId);
      if (!product) {
        throw new ResourceNotFoundError('Produto Químico', input.productId);
      }

      if (!product.canBeUsedInOperations()) {
        throw new BusinessRuleError(
          'Um produto químico inativo não pode ser associado a uma carga química',
        );
      }

      existingChemicalShipment.changeProduct(input.productId);
    }

    if (input.responsibleUserId) {
      const user = await this.users.findById(input.responsibleUserId);
      if (!user) {
        throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
      }

      existingChemicalShipment.changeResponsibleUser(input.responsibleUserId);
    }

    if (input.documentsIds) {
      existingChemicalShipment.changeDocuments(input.documentsIds);
    }

    if (input.quantityProduct !== undefined) {
      existingChemicalShipment.changeQuantityProduct(input.quantityProduct);
    }

    const updated = await this.chemicalShipments.update(existingChemicalShipment);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? updated.responsibleUserId;
      const resolvedActorName = actorName ?? 'Operador';

      const action = input.status ? AuditAction.STATUS_CHANGED : AuditAction.UPDATED;
      const description = input.status
        ? `Usuário "${resolvedActorName}" alterou o status da carga química "${updated.id}" para "${input.status}"`
        : `Usuário "${resolvedActorName}" atualizou a carga química "${updated.id}"`;

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_SHIPMENT,
        entityId: updated.id,
        actorId,
        actorName: resolvedActorName,
        action,
        description,
        details: {
          status: updated.status,
          quantity: updated.quantityProduct,
        },
      });
    }

    return updated;
  }
}
