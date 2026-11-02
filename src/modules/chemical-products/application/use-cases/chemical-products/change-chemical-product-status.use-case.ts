import { Inject, Injectable, Optional } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { USER_REPOSITORY } from '@/modules/user/domain/repositories/user.repository.js';
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import type { ChemicalProductActionActor } from './create-chemical-product.use-case.js';
import { transitionProductStatus } from './product-status-transition.js';

/**
 * Altera o status de um produto químico (Operador Portuário).
 *
 * O operador pode ativar, inativar ou bloquear o produto. UNDER_ANALYSIS é
 * apenas o status inicial do cadastro e não pode ser definido por aqui.
 */
@Injectable()
export class ChangeChemicalProductStatusUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Optional() @Inject(USER_REPOSITORY) private readonly users?: UserRepository,
    @Optional() @Inject(AUDIT_LOG_RECORDER) private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    id: string,
    status: ProductStatus,
    actor?: ChemicalProductActionActor | null,
  ): Promise<ChemicalProduct> {
    return transitionProductStatus(
      { products: this.products, users: this.users, auditLogs: this.auditLogs },
      id,
      status,
      (product) => {
        switch (status) {
          case ProductStatus.ACTIVE:
            product.activate();
            break;
          case ProductStatus.INACTIVE:
            product.deactivate();
            break;
          case ProductStatus.BLOCKED:
            product.block();
            break;
          default:
            throw new BusinessRuleError(
              `O status ${status} é apenas o status inicial do cadastro e não pode ser atribuído a um produto já cadastrado.`,
            );
        }
      },
      actor,
    );
  }
}

