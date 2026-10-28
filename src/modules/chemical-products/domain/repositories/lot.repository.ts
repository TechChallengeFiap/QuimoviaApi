import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';

export interface LotSearchFilters {
  status?: LotStatus;
  page: number;
  pageSize: number;
}

export interface LotPage {
  items: Lot[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Porta de persistência do agregado Lote.
 *
 * Lotes nunca são removidos fisicamente: o descarte é um status (DISPOSED),
 * para preservar a rastreabilidade exigida nas operações portuárias.
 */
export interface LotRepository {
  create(lot: Lot): Promise<Lot>;
  update(lot: Lot): Promise<Lot>;
  findById(id: string): Promise<Lot | null>;
  findByProductAndLotNumber(chemicalProductId: string, lotNumber: string): Promise<Lot | null>;
  listByProduct(chemicalProductId: string, filters: LotSearchFilters): Promise<LotPage>;
  /** Quantidade de lotes do produto que ainda não chegaram a um status final (RELEASED ou DISPOSED). */
  countOpenByProduct(chemicalProductId: string): Promise<number>;
}

/** Token de injeção usado pelo Nest para resolver a implementação concreta. */
export const LOT_REPOSITORY = Symbol('LotRepository');
