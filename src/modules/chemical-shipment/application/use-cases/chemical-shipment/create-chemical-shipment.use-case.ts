import {
  ChemicalShipment,
  CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { CHEMICAL_SHIPMENT_REPOSITORY } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  CHEMICAL_PRODUCT_REPOSITORY,
  type ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';

export interface ChemicalShipmentActionActor {
  id: string;
  name?: string;
}

@Injectable()
export class CreateChemicalShipmentUseCase {
  private readonly logger = new Logger(CreateChemicalShipmentUseCase.name);

  constructor(
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipmentRepository: ChemicalShipmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(CHEMICAL_PRODUCT_REPOSITORY)
    private readonly chemicalProductRepository: ChemicalProductRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(
    input: CreateChemicalShipmentData,
    actor?: ChemicalShipmentActionActor | null,
  ): Promise<ChemicalShipment> {
    try {
      const { responsibleUser, chemicalProduct } = await this.validateInput(input);

      const chemicalShipment = ChemicalShipment.create(input);
      const created = await this.chemicalShipmentRepository.create(chemicalShipment);

      if (this.auditLogs) {
        let actorName = actor?.name;
        if (!actorName && actor?.id) {
          const user = await this.userRepository.findById(actor.id);
          actorName = user?.name;
        }
        const actorId = actor?.id ?? responsibleUser.id;
        const resolvedActorName = actorName ?? responsibleUser.name;

        await this.auditLogs.record({
          entityType: AuditedEntity.CHEMICAL_SHIPMENT,
          entityId: created.id,
          actorId,
          actorName: resolvedActorName,
          action: AuditAction.CREATED,
          description: `Usuário "${resolvedActorName}" registrou a carga química "${created.id}" (${chemicalProduct.technicalName})`,
          details: {
            productId: created.productId,
            productName: chemicalProduct.technicalName,
            quantity: created.quantityProduct,
            status: created.status,
          },
        });
      }

      return created;
    } catch (error) {
      this.logger.error(
        `Erro ao executar criação da carga química: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async validateInput(
    input: CreateChemicalShipmentData,
  ): Promise<{ responsibleUser: import('@/modules/user/domain/entities/user.entity.js').User; chemicalProduct: import('@/modules/chemical-products/domain/entities/chemical-product.entity.js').ChemicalProduct }> {
    const responsibleUser = await this.userRepository.findById(
      input.responsibleUserId,
    );
    if (!responsibleUser) {
      throw new ResourceNotFoundError('Usuário', input.responsibleUserId);
    }

    const chemicalProduct = await this.chemicalProductRepository.findById(
      input.productId,
    );
    if (!chemicalProduct) {
      throw new ResourceNotFoundError('Produto Químico', input.productId);
    }

    if (!chemicalProduct.canBeUsedInOperations()) {
      throw new BusinessRuleError(
        'Um produto químico inativo não pode ser usado em novas cargas',
      );
    }

    return { responsibleUser, chemicalProduct };
  }
}
