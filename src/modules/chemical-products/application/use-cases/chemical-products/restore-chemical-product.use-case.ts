import { Inject, Injectable, Optional } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
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

/** Desfaz a exclusão lógica de um produto químico, devolvendo-o ao catálogo. */
@Injectable()
export class RestoreChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Optional() @Inject(USER_REPOSITORY) private readonly users?: UserRepository,
    @Optional() @Inject(AUDIT_LOG_RECORDER) private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, actor?: ChemicalProductActionActor | null): Promise<ChemicalProduct> {
    const product = await this.products.findById(id, { includeDeleted: true });

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', id);
    }

    product.restoreFromDeletion();

    const restored = await this.products.update(product);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id && this.users) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      const actorId = actor?.id ?? restored.responsibleUserId;
      const resolvedActorName = actorName ?? 'Responsável Técnico';

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: restored.id,
        actorId,
        actorName: resolvedActorName,
        action: AuditAction.UPDATED,
        description: `Usuário "${resolvedActorName}" restaurou o produto químico "${restored.technicalName}" (${restored.code})`,
        details: { code: restored.code, restored: true },
      });
    }

    return restored;
  }
}
