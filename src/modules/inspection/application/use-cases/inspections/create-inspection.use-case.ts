import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Inspection,
  type CreateInspectionData,
} from '@/modules/inspection/domain/entities/inspection.entity.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import { logError } from '@/shared/application/log-error.js';

@Injectable()
export class CreateInspectionUseCase {
  private readonly logger = new Logger(CreateInspectionUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspections: InspectionRepository,
  ) {}

  /** A entrada é a mesma da criação da entidade, que valida os dados. */
  async execute(input: CreateInspectionData): Promise<Inspection> {
    try {
      const inspection = Inspection.create(input);

      return await this.inspections.create(inspection);
    } catch (error) {
      logError(this.logger, 'Erro ao cadastrar a inspeção', error);
      throw error;
    }
  }
}
