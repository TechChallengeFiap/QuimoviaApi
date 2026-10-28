import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { loadLotOfProduct } from './load-lot-of-product.js';

/** QUARANTINED -> AVAILABLE: libera o lote após a suspeita ser afastada. */
@Injectable()
export class ReleaseLotFromQuarantineUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(chemicalProductId: string, lotId: string): Promise<Lot> {
    const lot = await loadLotOfProduct(this.lots, chemicalProductId, lotId);

    lot.releaseFromQuarantine();

    return this.lots.update(lot);
  }
}
