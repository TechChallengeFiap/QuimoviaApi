import { Inject, Injectable, Logger } from '@nestjs/common';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import {
  CHEMICAL_SHIPMENT_REPOSITORY,
  type ChemicalShipmentRepository,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';

export interface CreateInspectionInput {
  cargoId: string;
  compositionVersion: number;
  scope: InspectionScope;
  cargoItemId?: string;
  inspectorId: string;
  requirements: InspectionRequirement[];
}

@Injectable()
export class CreateInspectionUseCase {
  private readonly logger = new Logger(CreateInspectionUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionsRepository: InspectionRepository,
    @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
    private readonly chemicalShipmentsRepository: ChemicalShipmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
  ) {}

  async execute(input: CreateInspectionInput): Promise<Inspection> {
    try {
      const { chemicalShipment, inspector } = await this.validateInput(input);
      const inspection = Inspection.create({
        cargoId: input.cargoId,
        cargo: chemicalShipment,
        compositionVersion: input.compositionVersion,
        scope: input.scope,
        cargoItemId: input.cargoItemId,
        inspectorId: input.inspectorId,
        inspector,
        requirements: input.requirements,
      });

      return await this.inspectionsRepository.create(inspection);
    } catch (error) {
      this.logger.error(
        `Erro ao cadastrar a inspeção: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async validateInput(input: CreateInspectionInput): Promise<{
    chemicalShipment: ChemicalShipment;
    inspector: User;
  }> {
    const chemicalShipment = await this.chemicalShipmentsRepository.findById(
      input.cargoId,
    );
    if (!chemicalShipment) {
      throw new ResourceNotFoundError('Carga Química', input.cargoId);
    }
    const inspector = await this.usersRepository.findById(input.inspectorId);
    if (!inspector) {
      throw new ResourceNotFoundError('Usuário', input.inspectorId);
    }
    if (inspector.status !== UserStatus.ACTIVE) {
      throw new BusinessRuleError(
        'O fiscal responsável pela inspeção deve estar ativo no sistema.',
      );
    }
    return { chemicalShipment, inspector };
  }
}
