import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import type { AuditLogRecorder } from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import type { ChemicalProductActionActor } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';

export interface ProductStatusTransitionDependencies {
  products: ChemicalProductRepository;
  users?: UserRepository;
  auditLogs?: AuditLogRecorder;
}

/**
 * Rotina compartilhada pelas ações de status do produto (ativar, inativar e
 * bloquear): carrega o produto, aplica a transição pela entidade, persiste e
 * registra o log de auditoria com o ator da operação. Quando o status já é o
 * pedido, devolve o produto sem alterar nem auditar nada.
 */
export async function transitionProductStatus(
  deps: ProductStatusTransitionDependencies,
  id: string,
  target: ProductStatus,
  apply: (product: ChemicalProduct) => void,
  actor?: ChemicalProductActionActor | null,
): Promise<ChemicalProduct> {
  const product = await deps.products.findById(id);

  if (!product) {
    throw new ResourceNotFoundError('Produto químico', id);
  }

  if (product.status === target) {
    return product;
  }

  const previousStatus = product.status;
  apply(product);

  const updated = await deps.products.update(product);

  if (deps.auditLogs) {
    let actorName = actor?.name;
    if (!actorName && actor?.id && deps.users) {
      const user = await deps.users.findById(actor.id);
      actorName = user?.name;
    }
    const actorId = actor?.id ?? updated.responsibleUserId;
    const resolvedActorName = actorName ?? 'Operador Portuário';

    await deps.auditLogs.record({
      entityType: AuditedEntity.CHEMICAL_PRODUCT,
      entityId: updated.id,
      actorId,
      actorName: resolvedActorName,
      action: AuditAction.STATUS_CHANGED,
      description: `Usuário "${resolvedActorName}" alterou o status do produto químico "${updated.technicalName}" (${updated.code}) para "${target}"`,
      details: { previousStatus, newStatus: target },
    });
  }

  return updated;
}
