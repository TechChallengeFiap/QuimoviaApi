import { Inject, Injectable, Optional } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
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

/** Ativa um produto químico, liberando-o para novas operações e para receber lotes (Operador Portuário). */
@Injectable()
export class ActivateChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Optional() @Inject(USER_REPOSITORY) private readonly users?: UserRepository,
    @Optional() @Inject(AUDIT_LOG_RECORDER) private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, actor?: ChemicalProductActionActor | null): Promise<ChemicalProduct> {
    return transitionProductStatus(
      { products: this.products, users: this.users, auditLogs: this.auditLogs },
      id,
      ProductStatus.ACTIVE,
      (product) => product.activate(),
      actor,
    );
  }
}
