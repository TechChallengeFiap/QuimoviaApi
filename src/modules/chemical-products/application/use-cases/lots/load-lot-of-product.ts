import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import type { LotRepository } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';

/**
 * Carrega um lote garantindo que ele pertence ao produto informado na rota.
 * Um lote de outro produto é tratado como inexistente, para não vazar dados.
 */
export async function loadLotOfProduct(
  lots: LotRepository,
  chemicalProductId: string,
  lotId: string,
): Promise<Lot> {
  const lot = await lots.findById(lotId);

  if (!lot || lot.chemicalProductId !== chemicalProductId) {
    throw new ResourceNotFoundError('Lote', lotId);
  }

  return lot;
}
