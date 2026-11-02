import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

function createLot(override: Partial<Parameters<typeof Lot.create>[0]> = {}): Lot {
  return Lot.create({
    chemicalProductId: 'product-001',
    lotNumber: 'l2026-0001',
    quantity: 1500.5,
    ...override,
  });
}

/** Leva um lote recém-recebido até AVAILABLE pelo caminho normal. */
function createAvailableLot(): Lot {
  const lot = createLot();
  lot.startInspection();
  lot.approve();
  return lot;
}

describe('Lot', () => {
  it('nasce RECEIVED, com o número normalizado em maiúsculas e sem reserva', () => {
    const lot = createLot();

    expect(lot.status).toBe(LotStatus.RECEIVED);
    expect(lot.lotNumber).toBe('L2026-0001');
    expect(lot.quantity).toBe(1500.5);
    expect(lot.reservedForOperationId).toBeNull();
    expect(lot.canBeMovedBy()).toBe(false);
  });

  it('rejeita número de lote vazio ou inválido e quantidade não positiva', () => {
    expect(() => createLot({ lotNumber: '  ' })).toThrow(BusinessRuleError);
    expect(() => createLot({ lotNumber: 'L 2026' })).toThrow(BusinessRuleError);
    expect(() => createLot({ quantity: 0 })).toThrow(BusinessRuleError);
    expect(() => createLot({ quantity: -1 })).toThrow(BusinessRuleError);
    expect(() => createLot({ quantity: Number.NaN })).toThrow(BusinessRuleError);
  });

  it('segue o fluxo recebido -> inspeção -> disponível', () => {
    const lot = createLot();

    expect(() => lot.approve()).toThrow(BusinessRuleError);

    lot.startInspection();
    expect(lot.status).toBe(LotStatus.UNDER_INSPECTION);
    expect(lot.canBeMovedBy()).toBe(false);

    lot.approve();
    expect(lot.status).toBe(LotStatus.AVAILABLE);
    expect(lot.canBeMovedBy()).toBe(true);
  });

  it('permite corrigir número e quantidade apenas durante a conferência', () => {
    const lot = createLot();

    lot.changeQuantity(1480);
    lot.startInspection();
    lot.changeLotNumber('l2026-0001a');

    expect(lot.quantity).toBe(1480);
    expect(lot.lotNumber).toBe('L2026-0001A');

    lot.approve();
    expect(() => lot.changeQuantity(10)).toThrow(BusinessRuleError);
    expect(() => lot.changeLotNumber('X')).toThrow(BusinessRuleError);
  });

  it('um lote reservado só pode ser movimentado pela operação que o reservou', () => {
    const lot = createAvailableLot();

    expect(() => lot.reserve('  ')).toThrow(BusinessRuleError);

    lot.reserve('OP-1');
    expect(lot.status).toBe(LotStatus.RESERVED);
    expect(lot.reservedForOperationId).toBe('OP-1');
    expect(lot.canBeMovedBy()).toBe(false);
    expect(lot.canBeMovedBy('OP-2')).toBe(false);
    expect(lot.canBeMovedBy('OP-1')).toBe(true);

    expect(() => lot.release()).toThrow(BusinessRuleError);
    expect(() => lot.release('OP-2')).toThrow(BusinessRuleError);

    lot.release('OP-1');
    expect(lot.status).toBe(LotStatus.RELEASED);
    expect(lot.reservedForOperationId).toBeNull();
    expect(lot.isTerminal()).toBe(true);
  });

  it('cancelar a reserva devolve o lote ao estoque disponível', () => {
    const lot = createAvailableLot();
    lot.reserve('OP-1');

    lot.cancelReservation();

    expect(lot.status).toBe(LotStatus.AVAILABLE);
    expect(lot.reservedForOperationId).toBeNull();
    expect(() => lot.cancelReservation()).toThrow(BusinessRuleError);
  });

  it('um lote disponível pode sair do porto por qualquer operação', () => {
    const lot = createAvailableLot();

    lot.release();

    expect(lot.status).toBe(LotStatus.RELEASED);
  });

  it('armazena e retira do armazenamento apenas lotes disponíveis', () => {
    const lot = createAvailableLot();

    lot.store();
    expect(lot.status).toBe(LotStatus.IN_STORAGE);
    expect(lot.canBeMovedBy()).toBe(false);
    expect(() => lot.release()).toThrow(BusinessRuleError);
    expect(() => lot.store()).toThrow(BusinessRuleError);

    lot.withdrawFromStorage();
    expect(lot.status).toBe(LotStatus.AVAILABLE);
    expect(() => lot.withdrawFromStorage()).toThrow(BusinessRuleError);
  });

  it('a quarentena desfaz uma reserva ativa e só é liberada para AVAILABLE', () => {
    const lot = createAvailableLot();
    lot.reserve('OP-1');

    lot.quarantine();

    expect(lot.status).toBe(LotStatus.QUARANTINED);
    expect(lot.reservedForOperationId).toBeNull();
    expect(lot.canBeMovedBy('OP-1')).toBe(false);
    expect(() => lot.release('OP-1')).toThrow(BusinessRuleError);

    lot.releaseFromQuarantine();
    expect(lot.status).toBe(LotStatus.AVAILABLE);
  });

  it('o descarte só é permitido para lotes em quarentena ou vencidos', () => {
    const available = createAvailableLot();
    expect(() => available.dispose()).toThrow(BusinessRuleError);

    const quarantined = createAvailableLot();
    quarantined.quarantine();
    quarantined.dispose();
    expect(quarantined.status).toBe(LotStatus.DISPOSED);

    const expired = createLot();
    expired.expire();
    expect(expired.status).toBe(LotStatus.EXPIRED);
    expired.dispose();
    expect(expired.status).toBe(LotStatus.DISPOSED);
    expect(expired.isTerminal()).toBe(true);
  });

  it('status finais não aceitam novas transições', () => {
    const released = createAvailableLot();
    released.release();

    expect(() => released.quarantine()).toThrow(BusinessRuleError);
    expect(() => released.expire()).toThrow(BusinessRuleError);
    expect(() => released.dispose()).toThrow(BusinessRuleError);
    expect(() => released.startInspection()).toThrow(BusinessRuleError);

    const disposed = createLot();
    disposed.expire();
    disposed.dispose();

    expect(() => disposed.expire()).toThrow(BusinessRuleError);
    expect(() => disposed.quarantine()).toThrow(BusinessRuleError);
  });
});
