import { Inject, Injectable, Logger } from '@nestjs/common';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type Page,
} from '@/shared/domain/pagination.js';

export interface ListInspectionsInput {
  cargoId?: string;
  inspectorId?: string;
  status?: InspectionStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListInspectionsUseCase {
  private readonly logger = new Logger(ListInspectionsUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspections: InspectionRepository,
  ) {}

  async execute(input: ListInspectionsInput = {}): Promise<Page<Inspection>> {
    try {
      return await this.inspections.list({
        cargoId: input.cargoId,
        inspectorId: input.inspectorId,
        status: input.status,
        page: input.page ?? DEFAULT_PAGE,
        pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar as inspeções: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
