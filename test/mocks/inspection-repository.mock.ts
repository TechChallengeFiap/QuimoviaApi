import type {
  InspectionRepository,
  InspectionSearchFilters,
} from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import type { Page } from '@/shared/domain/pagination.js';

/** Implementação em memória de InspectionRepository, para uso nos testes. */
export class InspectionRepositoryMock implements InspectionRepository {
  private readonly inspections = new Map<string, Inspection>();

  async create(inspection: Inspection): Promise<Inspection> {
    this.inspections.set(inspection.id, inspection);
    return inspection;
  }

  async update(inspection: Inspection): Promise<Inspection> {
    this.inspections.set(inspection.id, inspection);
    return inspection;
  }

  async remove(id: string): Promise<void> {
    this.inspections.delete(id);
  }

  async findById(id: string): Promise<Inspection | null> {
    return this.inspections.get(id) ?? null;
  }

  async list(filters: InspectionSearchFilters): Promise<Page<Inspection>> {
    let items = [...this.inspections.values()];

    if (filters.cargoId) {
      items = items.filter(
        (inspection) => inspection.cargoId === filters.cargoId,
      );
    }

    if (filters.inspectorId) {
      items = items.filter(
        (inspection) => inspection.inspectorId === filters.inspectorId,
      );
    }

    if (filters.status) {
      items = items.filter(
        (inspection) => inspection.status === filters.status,
      );
    }

    const total = items.length;
    const start = (filters.page - 1) * filters.pageSize;

    return {
      items: items.slice(start, start + filters.pageSize),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }
}
