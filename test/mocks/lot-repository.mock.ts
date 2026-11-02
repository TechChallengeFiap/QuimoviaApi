import type { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import type {
  LotPage,
  LotRepository,
  LotSearchFilters,
} from '@/modules/chemical-products/domain/repositories/lot.repository.js';

/** Implementação em memória de LotRepository, para uso nos testes. */
export class LotRepositoryMock implements LotRepository {
  private readonly lots = new Map<string, Lot>();

  async create(lot: Lot): Promise<Lot> {
    this.lots.set(lot.id, lot);
    return lot;
  }

  async update(lot: Lot): Promise<Lot> {
    this.lots.set(lot.id, lot);
    return lot;
  }

  async findById(id: string): Promise<Lot | null> {
    return this.lots.get(id) ?? null;
  }

  async findByProductAndLotNumber(chemicalProductId: string, lotNumber: string): Promise<Lot | null> {
    return (
      [...this.lots.values()].find(
        (lot) => lot.chemicalProductId === chemicalProductId && lot.lotNumber === lotNumber,
      ) ?? null
    );
  }

  async listByProduct(chemicalProductId: string, filters: LotSearchFilters): Promise<LotPage> {
    let items = [...this.lots.values()].filter((lot) => lot.chemicalProductId === chemicalProductId);

    if (filters.status) {
      items = items.filter((lot) => lot.status === filters.status);
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

  async countOpenByProduct(chemicalProductId: string): Promise<number> {
    return [...this.lots.values()].filter(
      (lot) => lot.chemicalProductId === chemicalProductId && !lot.isTerminal(),
    ).length;
  }
}
