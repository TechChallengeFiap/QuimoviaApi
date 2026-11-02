import { Inject, Injectable, Optional } from '@nestjs/common';
import { BusinessRuleError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { ChemicalProductActionActor } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';

/**
 * Exclusão lógica de um produto químico.
 *
 * O registro é mantido no banco, com deletedAt preenchido, para não quebrar
 * as cargas químicas, lotes e demais históricos que o referenciam. Ele some
 * das buscas e listagens e pode ser restaurado por RestoreChemicalProductUseCase.
 */
@Injectable()
export class DeleteChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Inject(LOT_REPOSITORY) private readonly lots: LotRepository,
    @Optional() @Inject(USER_REPOSITORY) private readonly users?: UserRepository,
    @Optional() @Inject(AUDIT_LOG_RECORDER) private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, actor?: ChemicalProductActionActor | null): Promise<void> {
    const product = await this.products.findById(id);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', id);
    }

    /** Lotes em aberto ainda estão em operação no porto; lotes finais são só histórico. */
    if ((await this.lots.countOpenByProduct(id)) > 0) {
      throw new BusinessRuleError(
        'Não é possível excluir um produto químico com lotes em aberto; conclua ou descarte os lotes antes.',
      );
    }

    product.markAsDeleted();

    await this.products.update(product);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id && this.users) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? product.responsibleUserId;
      const resolvedActorName = actorName ?? 'Responsável Técnico';

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: product.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.DELETED,
        description: `Usuário "${resolvedActorName}" excluiu o produto químico "${product.technicalName}" (${product.code})`,
        details: { code: product.code, technicalName: product.technicalName, softDelete: true },
      });
    }
  }
}
