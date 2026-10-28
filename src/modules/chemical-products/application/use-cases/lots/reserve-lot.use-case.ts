import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { loadLotOfProduct } from './load-lot-of-product.js';

export interface ReserveLotInput {
  /** Identificador da operação que passa a ter exclusividade sobre o lote. */
  operationId: string;
}

/** AVAILABLE -> RESERVED: a partir daí só a operação informada pode movimentar o lote. */
@Injectable()
export class ReserveLotUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(chemicalProductId: string, lotId: string, input: ReserveLotInput): Promise<Lot> {
    const lot = await loadLotOfProduct(this.lots, chemicalProductId, lotId);

    lot.reserve(input.operationId);

    return this.lots.update(lot);
  }
}
