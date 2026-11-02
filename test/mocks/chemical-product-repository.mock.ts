import type {
  ChemicalProductRepository,
  ChemicalProductSearchFilters,
  ChemicalProductPage,
  FindChemicalProductOptions,
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

  async findById(
    id: string,
    options: FindChemicalProductOptions = {},
  ): Promise<ChemicalProduct | null> {
    const product = this.products.get(id) ?? null;

    return product && (options.includeDeleted || !product.isDeleted()) ? product : null;
  }

  async findByCode(
    code: string,
    options: FindChemicalProductOptions = {},
  ): Promise<ChemicalProduct | null> {
    return (
      [...this.products.values()].find(
        (product) =>
          product.code === code && (options.includeDeleted || !product.isDeleted()),
      ) ?? null
    );
  }

  async list(filters: ChemicalProductSearchFilters): Promise<ChemicalProductPage> {
    let items = [...this.products.values()].filter((product) => !product.isDeleted());

    if (filters.riskClass) {
      items = items.filter((product) => product.riskClass === filters.riskClass);
    }

    if (filters.physicalState) {
      items = items.filter((product) => product.physicalState === filters.physicalState);
    }

    if (filters.status) {
      items = items.filter((product) => product.status === filters.status);
    }

    if (filters.responsibleUserId) {
      items = items.filter((product) => product.responsibleUserId === filters.responsibleUserId);
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
