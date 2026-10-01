import type {
  ChemicalProductRepository,
  ChemicalProductSearchFilters,
  ChemicalProductPage,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';

/** Implementação em memória de ChemicalProductRepository, para uso nos testes. */
export class ChemicalProductRepositoryMock implements ChemicalProductRepository {
  private readonly products = new Map<string, ChemicalProduct>();

  async create(product: ChemicalProduct): Promise<ChemicalProduct> {
    this.products.set(product.id, product);
    return product;
  }

  async update(product: ChemicalProduct): Promise<ChemicalProduct> {
    this.products.set(product.id, product);
    return product;
  }

  async remove(id: string): Promise<void> {
    this.products.delete(id);
  }

  async findById(id: string): Promise<ChemicalProduct | null> {
    return this.products.get(id) ?? null;
  }

  async findByCode(code: string): Promise<ChemicalProduct | null> {
    return [...this.products.values()].find((product) => product.code === code) ?? null;
  }

  async list(filters: ChemicalProductSearchFilters): Promise<ChemicalProductPage> {
    let items = [...this.products.values()];

    if (filters.riskClass) {
      items = items.filter((product) => product.riskClass === filters.riskClass);
    }

    if (filters.physicalState) {
      items = items.filter((product) => product.physicalState === filters.physicalState);
    }

    if (filters.status) {
      items = items.filter((product) => product.status === filters.status);
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
