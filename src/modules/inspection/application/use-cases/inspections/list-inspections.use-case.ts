import { Inject, Injectable, Logger } from '@nestjs/common';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type {
  InspectionRepository,
  InspectionSearchFilters,
} from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type Page,
} from '@/shared/domain/pagination.js';
import { logError } from '@/shared/application/log-error.js';

export type ListInspectionsInput = Partial<InspectionSearchFilters>;

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
        ...input,
        page: input.page ?? DEFAULT_PAGE,
        pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
      });
    } catch (error) {
      logError(this.logger, 'Erro ao listar as inspeções', error);
      throw error;
    }
  }
}
