import { Inject, Injectable, Optional } from '@nestjs/common';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
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
import type { ChemicalProductActionActor } from '@/modules/chemical-products/application/use-cases/chemical-products/create-chemical-product.use-case.js';

export interface UpdateChemicalProductInput {
  code?: string;
  technicalName?: string;
  tradeName?: string | null;
  unNumber?: string;
  riskClass?: ProductRiskClass;
  physicalState?: ProductPhysicalState;
  responsibleUserId?: string;
}

/**
 * Atualiza os dados cadastrais de um produto químico (Responsável Técnico).
 *
 * A alteração de status é um caso de uso à parte, de outro ator, e por isso
 * fica em ChangeChemicalProductStatusUseCase.
 */
@Injectable()
export class UpdateChemicalProductUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    id: string,
    input: UpdateChemicalProductInput,
    actor?: ChemicalProductActionActor | null,
  ): Promise<ChemicalProduct> {
    const product = await this.products.findById(id);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', id);
    }

    if (input.code !== undefined) {
      await this.changeCode(product, input.code);
    }

    if (input.technicalName !== undefined) {
      product.changeTechnicalName(input.technicalName);
    }

    if (input.tradeName !== undefined) {
      product.changeTradeName(input.tradeName);
    }

    if (input.unNumber !== undefined) {
      product.changeUnNumber(input.unNumber);
    }

    if (input.riskClass !== undefined) {
      product.changeRiskClass(input.riskClass);
    }

    if (input.physicalState !== undefined) {
      product.changePhysicalState(input.physicalState);
    }

    if (input.responsibleUserId !== undefined) {
      await this.changeResponsibleUser(product, input.responsibleUserId);
    }

    const updated = await this.products.update(product);

    if (this.auditLogs) {
      let actorName = actor?.name;
      if (!actorName && actor?.id) {
        const user = await this.users.findById(actor.id);
        actorName = user?.name;
      }
      if (!actorName) {
        const resp = await this.users.findById(updated.responsibleUserId);
        actorName = resp?.name ?? 'Responsável Técnico';
      }
      const actorId = actor?.id ?? updated.responsibleUserId;

      await this.auditLogs.record({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: updated.id,
        actorId,
        actorName,
        action: AuditAction.UPDATED,
        description: `Usuário "${actorName}" editou o produto químico "${updated.technicalName}" (${updated.code})`,
        details: {
          code: updated.code,
          technicalName: updated.technicalName,
          riskClass: updated.riskClass,
        },
      });
    }

    return updated;
  }

  private async changeCode(product: ChemicalProduct, code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode === product.code) {
      return;
    }

    const existing = await this.products.findByCode(normalizedCode);

    if (existing) {
      throw new ConflictError(
        `Já existe um produto químico cadastrado com o código "${normalizedCode}".`,
      );
    }

    product.changeCode(normalizedCode);
  }

  private async changeResponsibleUser(
    product: ChemicalProduct,
    responsibleUserId: string,
  ): Promise<void> {
    if (responsibleUserId === product.responsibleUserId) {
      return;
    }

    const user = await this.users.findById(responsibleUserId);

    if (!user) {
      throw new ResourceNotFoundError('Usuário', responsibleUserId);
    }

    product.changeResponsibleUser(user.id);
  }
}
