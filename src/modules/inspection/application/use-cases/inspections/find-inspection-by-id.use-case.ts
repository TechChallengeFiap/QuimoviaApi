import { Inject, Injectable, Logger } from '@nestjs/common';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';

@Injectable()
export class FindInspectionByIdUseCase {
  private readonly logger = new Logger(FindInspectionByIdUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspections: InspectionRepository,
  ) {}

  async execute(id: string): Promise<Inspection> {
    try {
      const inspection = await this.inspections.findById(id);

      if (!inspection) {
        throw new ResourceNotFoundError('Inspeção', id);
      }

      return inspection;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar a inspeção com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
