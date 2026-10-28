/**
 * Situação atual de um lote de produto químico.
 *
 * Apenas lotes AVAILABLE podem ser movimentados livremente. Lotes RESERVED só
 * podem ser movimentados pela operação que os reservou. Os demais status não
 * permitem movimentação. RELEASED e DISPOSED são finais.
 */
export enum LotStatus {
  /** Recebido e registrado, mas ainda sem todas as conferências. */
  RECEIVED = 'RECEIVED',
  /** Em inspeção. */
  UNDER_INSPECTION = 'UNDER_INSPECTION',
  /** Aprovado e disponível para operações. */
  AVAILABLE = 'AVAILABLE',
  /** Reservado para uma operação específica. */
  RESERVED = 'RESERVED',
  /** Armazenado no porto. */
  IN_STORAGE = 'IN_STORAGE',
  /** Isolado por suspeita de problema, não conformidade ou exigência legal. */
  QUARANTINED = 'QUARANTINED',
  /** Saiu definitivamente do porto. */
  RELEASED = 'RELEASED',
  /** Venceu o prazo de validade. */
  EXPIRED = 'EXPIRED',
  /** Descartado ou destruído conforme normas ambientais. */
  DISPOSED = 'DISPOSED',
}

export const LOT_STATUSES = Object.values(LotStatus);
