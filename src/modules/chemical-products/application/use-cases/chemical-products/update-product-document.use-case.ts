import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  ProductDocument,
  UpdateProductDocumentData,
} from '@/modules/chemical-products/domain/entities/product-document.entity.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { ChemicalProductActionActor } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

@Injectable()
export class UpdateProductDocumentUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly products: ChemicalProductRepository,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly users?: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    productId: string,
    documentId: string,
    input: UpdateProductDocumentData,
    actor?: ChemicalProductActionActor | null,
  ): Promise<ProductDocument> {
    const product = await this.products.findById(productId);
    if (!product) throw new ResourceNotFoundError('Produto químico', productId);
    product.updateDocument(documentId, input);
    const updated = await this.products.update(product);
    const document = updated.findDocument(documentId);
    if (!document)
      throw new ResourceNotFoundError('Documento do produto', documentId);

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
        action: AuditAction.DOCUMENT_UPDATED,
        description: `Usuário "${resolvedActorName}" atualizou o documento "${document.number}" do produto químico "${updated.technicalName}"`,
        details: { documentId, documentNumber: document.number },
      });
    }

    return document;
  }
}
