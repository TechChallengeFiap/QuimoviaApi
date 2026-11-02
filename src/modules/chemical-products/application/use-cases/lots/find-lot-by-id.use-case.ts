import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { loadLotOfProduct } from './load-lot-of-product.js';

@Injectable()
export class FindLotByIdUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(chemicalProductId: string, lotId: string): Promise<Lot> {
    return loadLotOfProduct(this.lots, chemicalProductId, lotId);
  }
}
