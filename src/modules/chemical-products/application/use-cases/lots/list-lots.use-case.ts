import { Inject, Injectable } from '@nestjs/common';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';
import { CHEMICAL_PRODUCT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import type { ChemicalProductRepository } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotPage, LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListLotsInput {
  status?: LotStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListLotsUseCase {
  constructor(
    @Inject(CHEMICAL_PRODUCT_REPOSITORY) private readonly products: ChemicalProductRepository,
    @Inject(LOT_REPOSITORY) private readonly lots: LotRepository,
  ) {}

  async execute(chemicalProductId: string, input: ListLotsInput = {}): Promise<LotPage> {
    const product = await this.products.findById(chemicalProductId);

    if (!product) {
      throw new ResourceNotFoundError('Produto químico', chemicalProductId);
    }

    return this.lots.listByProduct(product.id, {
      status: input.status,
      page: input.page ?? DEFAULT_PAGE,
      pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
    });
  }
}
