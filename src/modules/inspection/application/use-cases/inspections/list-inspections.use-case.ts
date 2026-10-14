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
import { logError } from '@/shared/application/log-error.js';

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
      logError(this.logger, 'Erro ao listar as inspeções', error);
      throw error;
    }
  }
}
