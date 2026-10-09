import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';

@Injectable()
export class DeleteInspectionUseCase {
  private readonly logger = new Logger(DeleteInspectionUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspections: InspectionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const inspection = await this.inspections.findById(id);

      if (!inspection) {
        throw new ResourceNotFoundError('Inspeção', id);
      }

      if (!inspection.canBeRemoved()) {
        throw new BusinessRuleError(
          'Somente inspeções pendentes podem ser removidas; as demais fazem parte do histórico da carga.',
        );
      }

      await this.inspections.remove(id);
    } catch (error) {
      this.logger.error(
        `Erro ao remover a inspeção com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
