import { Inject, Injectable, Logger } from '@nestjs/common';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';

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
    private readonly inspections: InspectionRepository,
  ) {}

  async execute(input: CreateInspectionInput): Promise<Inspection> {
    try {
      const inspection = Inspection.create({
        cargoId: input.cargoId,
        compositionVersion: input.compositionVersion,
        scope: input.scope,
        cargoItemId: input.cargoItemId,
        inspectorId: input.inspectorId,
        requirements: input.requirements,
      });

      return await this.inspections.create(inspection);
    } catch (error) {
      this.logger.error(
        `Erro ao cadastrar a inspeção: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
