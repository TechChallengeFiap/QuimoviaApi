import { Inject, Injectable } from '@nestjs/common';
import { ProductPhysicalState } from '@/modules/produtos-quimicos/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/produtos-quimicos/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/produtos-quimicos/domain/enums/product-status.enum.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import type {
  ChemicalProductPage,
  ChemicalProductRepository,
} from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListChemicalProductsInput {
  riskClass?: ProductRiskClass;
  physicalState?: ProductPhysicalState;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListChemicalProductsUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
  ) {}

  async execute(input: ListChemicalProductsInput = {}): Promise<ChemicalProductPage> {
    return this.products.list({
      riskClass: input.riskClass,
      physicalState: input.physicalState,
      status: input.status,
      page: input.page ?? DEFAULT_PAGE,
      pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
    });
  }
}
