import { Inject, Injectable, Optional } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { ConflictError, ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
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

export interface CreateProductDocumentInput {
  type: ProductDocumentType;
  number: string;
  expiresAt?: Date | null;
  filePath: string;
}

export interface CreateChemicalProductInput {
  code: string;
  technicalName: string;
  tradeName?: string | null;
  unNumber: string;
  riskClass: ProductRiskClass;
  physicalState: ProductPhysicalState;
  status?: ProductStatus;
  responsibleUserId: string;
  documents?: CreateProductDocumentInput[];
}

export interface ChemicalProductActionActor {
  id: string;
  name?: string;
}

@Injectable()
export class CreateChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    input: CreateChemicalProductInput,
    actor?: ChemicalProductActionActor | null,
  ): Promise<ChemicalProduct> {
    const code = input.code.trim().toUpperCase();
    /** O código é único no banco mesmo para excluídos, então a verificação os inclui. */
    const existing = await this.products.findByCode(code, { includeDeleted: true });

    if (existing) {
      throw new ConflictError(
        existing.isDeleted()
          ? `Já existe um produto químico excluído com o código "${code}"; restaure-o em vez de cadastrar outro.`
          : `Já existe um produto químico cadastrado com o código "${code}".`,
      );
    }

    const responsibleUser = await this.users.findById(input.responsibleUserId);

    if (!responsibleUser) {
      throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
    }

    const product = ChemicalProduct.create({
      code,
      technicalName: input.technicalName,
      tradeName: input.tradeName,
      unNumber: input.unNumber,
      riskClass: input.riskClass,
      physicalState: input.physicalState,
      status: input.status,
      responsibleUserId: responsibleUser.id,
      documents: input.documents,
    });

    const created = await this.products.create(product);

    if (this.auditLogs) {
      const actorId = actor?.id ?? responsibleUser.id;
      const actorName = actor?.name ?? responsibleUser.name;

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: created.id,
        actorId,
        actorName,
        action: AuditAction.CREATED,
        description: `Usuário "${actorName}" cadastrou o produto químico "${created.technicalName}" (${created.code})`,
        details: {
          riskClass: created.riskClass,
          physicalState: created.physicalState,
          status: created.status,
        },
      });
    }

    return created;
  }
}
