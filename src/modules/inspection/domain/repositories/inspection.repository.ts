import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import type { Page } from '@/shared/domain/pagination.js';

export interface InspectionSearchFilters {
  cargoId?: string;
  inspectorId?: string;
  status?: InspectionStatus;
  page: number;
  pageSize: number;
}

/**
 * Porta de persistência do agregado Inspeção.
 *
 * A camada de aplicação depende apenas desta interface; a implementação
 * concreta (Prisma) vive na camada de infraestrutura.
 */
export interface InspectionRepository {
  create(inspection: Inspection): Promise<Inspection>;
  update(inspection: Inspection): Promise<Inspection>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<Inspection | null>;
  list(filters: InspectionSearchFilters): Promise<Page<Inspection>>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const INSPECTION_REPOSITORY = Symbol('InspectionRepository');
