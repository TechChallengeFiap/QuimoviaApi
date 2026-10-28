import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { loadLotOfProduct } from './load-lot-of-product.js';

/** RECEIVED -> UNDER_INSPECTION: inicia a conferência do lote. */
@Injectable()
export class StartLotInspectionUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(chemicalProductId: string, lotId: string): Promise<Lot> {
    const lot = await loadLotOfProduct(this.lots, chemicalProductId, lotId);

    lot.startInspection();

    return this.lots.update(lot);
  }
}
