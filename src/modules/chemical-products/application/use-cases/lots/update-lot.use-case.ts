import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LOT_REPOSITORY } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { ConflictError } from '@/shared/domain/errors/domain.error.js';
import { loadLotOfProduct } from './load-lot-of-product.js';

export interface UpdateLotInput {
  lotNumber?: string;
  quantity?: number;
}

/**
 * Corrige os dados de recebimento de um lote (número e quantidade).
 *
 * A entidade só permite isso enquanto o lote está em conferência (RECEIVED ou
 * UNDER_INSPECTION). O status nunca é alterado por aqui: cada transição tem o
 * próprio caso de uso.
 */
@Injectable()
export class UpdateLotUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(chemicalProductId: string, lotId: string, input: UpdateLotInput): Promise<Lot> {
    const lot = await loadLotOfProduct(this.lots, chemicalProductId, lotId);

    if (input.lotNumber !== undefined) {
      await this.changeLotNumber(lot, input.lotNumber);
    }

    if (input.quantity !== undefined) {
      lot.changeQuantity(input.quantity);
    }

    return this.lots.update(lot);
  }

  private async changeLotNumber(lot: Lot, lotNumber: string): Promise<void> {
    const normalizedLotNumber = lotNumber.trim().toUpperCase();

    if (normalizedLotNumber === lot.lotNumber) {
      return;
    }

    const existing = await this.lots.findByProductAndLotNumber(
      lot.chemicalProductId,
      normalizedLotNumber,
    );

    if (existing) {
      throw new ConflictError(
        `Já existe o lote "${normalizedLotNumber}" registrado para este produto.`,
      );
    }

    lot.changeLotNumber(normalizedLotNumber);
  }
}
