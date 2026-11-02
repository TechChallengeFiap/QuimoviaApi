import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';

export interface ChemicalProductSearchFilters {
  riskClass?: ProductRiskClass;
  physicalState?: ProductPhysicalState;
  status?: ProductStatus;
  responsibleUserId?: string;
  page: number;
  pageSize: number;
}

export interface ChemicalProductPage {
  items: ChemicalProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FindChemicalProductOptions {
  /** Inclui produtos excluídos logicamente. Por padrão eles são ignorados. */
  includeDeleted?: boolean;
}

/**
 * Porta de persistência do agregado Produto Químico.
 *
 * O agregado é persistido por inteiro: `create` e `update` gravam o produto e
 * seus documentos. A exclusão é lógica (deletedAt), feita pela entidade e
 * persistida por `update`; por isso não há `remove`. As buscas e a listagem
 * ignoram produtos excluídos, salvo quando `includeDeleted` é informado.
 */
export interface ChemicalProductRepository {
  create(product: ChemicalProduct): Promise<ChemicalProduct>;
  update(product: ChemicalProduct): Promise<ChemicalProduct>;
  findById(id: string, options?: FindChemicalProductOptions): Promise<ChemicalProduct | null>;
  findByCode(code: string, options?: FindChemicalProductOptions): Promise<ChemicalProduct | null>;
  list(filters: ChemicalProductSearchFilters): Promise<ChemicalProductPage>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const CHEMICAL_PRODUCT_REPOSITORY = Symbol('ChemicalProductRepository');
