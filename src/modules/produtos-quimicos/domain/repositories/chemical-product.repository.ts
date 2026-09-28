import { ChemicalProduct } from '@/modules/produtos-quimicos/domain/entities/chemical-product.entity.js';
import { ProductPhysicalState } from '@/modules/produtos-quimicos/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/produtos-quimicos/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/produtos-quimicos/domain/enums/product-status.enum.js';

export interface ChemicalProductSearchFilters {
  riskClass?: ProductRiskClass;
  physicalState?: ProductPhysicalState;
  status?: ProductStatus;
  page: number;
  pageSize: number;
}

export interface ChemicalProductPage {
  items: ChemicalProduct[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Porta de persistência do agregado Produto Químico.
 *
 * O agregado é persistido por inteiro: `create` e `update` gravam o produto e
 * seus documentos. A camada de aplicação depende apenas desta interface; a
 * implementação concreta (Prisma) vive na camada de infraestrutura.
 */
export interface ChemicalProductRepository {
  create(product: ChemicalProduct): Promise<ChemicalProduct>;
  update(product: ChemicalProduct): Promise<ChemicalProduct>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<ChemicalProduct | null>;
  findByCode(code: string): Promise<ChemicalProduct | null>;
  list(filters: ChemicalProductSearchFilters): Promise<ChemicalProductPage>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const CHEMICAL_PRODUCT_REPOSITORY = Symbol('ChemicalProductRepository');
