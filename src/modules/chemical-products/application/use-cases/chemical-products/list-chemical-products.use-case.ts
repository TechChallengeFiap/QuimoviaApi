import { Inject, Injectable } from '@nestjs/common';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type {
  ChemicalProductPage,
  ChemicalProductRepository,
} from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListChemicalProductsInput {
  riskClass?: ProductRiskClass;
  physicalState?: ProductPhysicalState;
  status?: ProductStatus;
  responsibleUserId?: string;
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
      responsibleUserId: input.responsibleUserId,
      page: input.page ?? DEFAULT_PAGE,
      pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
    });
  }
}
