import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { loadLotOfProduct } from './load-lot-of-product.js';

export interface ReleaseLotInput {
  /** Operação que está retirando o lote. Obrigatória quando o lote está reservado. */
  operationId?: string;
}

/**
 * Saída definitiva do lote do porto (-> RELEASED).
 *
 * A entidade aplica a regra de movimentação: lotes AVAILABLE saem por qualquer
 * operação; lotes RESERVED só pela operação que os reservou.
 */
@Injectable()
export class ReleaseLotUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(
    chemicalProductId: string,
    lotId: string,
    input: ReleaseLotInput = {},
  ): Promise<Lot> {
    const lot = await loadLotOfProduct(this.lots, chemicalProductId, lotId);

    lot.release(input.operationId);

    return this.lots.update(lot);
  }
}
