import { Inject, Injectable, Optional } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { ChemicalProductActionActor } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';

export interface AddProductDocumentInput {
  type: ProductDocumentType;
  number: string;
  expiresAt?: Date | null;
  filePath: string;
}

@Injectable()
export class AddProductDocumentUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly users?: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    productId: string,
    input: AddProductDocumentInput,
    actor?: ChemicalProductActionActor | null,
  ): Promise<ChemicalProduct> {
    const product = await this.products.findById(productId);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', productId);
    }

    product.addDocument(input);

    const updated = await this.products.update(product);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id && this.users) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? updated.responsibleUserId;
      const resolvedActorName = actorName ?? 'Responsável Técnico';

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: updated.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.DOCUMENT_ADDED,
        description: `Usuário "${resolvedActorName}" adicionou documento "${input.number}" (${input.type}) ao produto químico "${updated.technicalName}"`,
        details: { documentType: input.type, documentNumber: input.number },
      });
    }

    return updated;
  }
}
