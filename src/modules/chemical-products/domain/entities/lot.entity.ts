import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';

const MAX_LOT_NUMBER_LENGTH = 60;
const LOT_NUMBER_FORMAT = /^[A-Z0-9][A-Z0-9._/-]*$/;
const MAX_OPERATION_ID_LENGTH = 120;

/** Status a partir dos quais o lote não sai mais. */
const TERMINAL_STATUSES: ReadonlySet<LotStatus> = new Set([
  LotStatus.RELEASED,
  LotStatus.DISPOSED,
]);

/** Status em que os dados de recebimento (número e quantidade) ainda podem ser corrigidos. */
const EDITABLE_STATUSES: ReadonlySet<LotStatus> = new Set([
  LotStatus.RECEIVED,
  LotStatus.UNDER_INSPECTION,
]);

export interface LotProperties {
  id: string;
  chemicalProductId: string;
  lotNumber: string;
  quantity: number;
  status: LotStatus;
  /** Identificador da operação que reservou o lote, enquanto ele estiver RESERVED. */
  reservedForOperationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLotData {
  chemicalProductId: string;
  lotNumber: string;
  quantity: number;
}

/**
 * Lote de um produto químico (raiz de agregado própria).
 *
 * Todo lote nasce RECEIVED e só muda de status pelos métodos de transição
 * abaixo, que concentram as regras de movimentação: apenas lotes AVAILABLE
 * podem ser movimentados livremente e lotes RESERVED só pela operação que os
 * reservou. A unicidade do número do lote por produto e a exigência de que o
 * produto esteja ativo são verificadas pelos casos de uso, via repositórios.
 */
export class Lot {
  readonly id: string;
  readonly chemicalProductId: string;
  readonly createdAt: Date;

  #lotNumber: string;
  #quantity: number;
  #status: LotStatus;
  #reservedForOperationId: string | null;
  #updatedAt: Date;

  private constructor(properties: LotProperties) {
    this.id = properties.id;
    this.chemicalProductId = properties.chemicalProductId;
    this.createdAt = properties.createdAt;
    this.#lotNumber = properties.lotNumber;
    this.#quantity = properties.quantity;
    this.#status = properties.status;
    this.#reservedForOperationId = properties.reservedForOperationId;
    this.#updatedAt = properties.updatedAt;
  }

  /** Registra o recebimento de um novo lote, validando os dados informados. */
  static create(data: CreateLotData): Lot {
    const now = new Date();

    return new Lot({
      id: randomUUID(),
      chemicalProductId: Lot.validateProductId(data.chemicalProductId),
      lotNumber: Lot.validateLotNumber(data.lotNumber),
      quantity: Lot.validateQuantity(data.quantity),
      status: LotStatus.RECEIVED,
      reservedForOperationId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstrói um lote já persistido, sem revalidar os dados. */
  static restore(properties: LotProperties): Lot {
    return new Lot(properties);
  }

  get lotNumber(): string {
    return this.#lotNumber;
  }

  get quantity(): number {
    return this.#quantity;
  }

  get status(): LotStatus {
    return this.#status;
  }

  get reservedForOperationId(): string | null {
    return this.#reservedForOperationId;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  /** Corrige o número do lote durante a conferência (RECEIVED ou UNDER_INSPECTION). */
  changeLotNumber(lotNumber: string): void {
    this.ensureEditable('alterar o número');
    this.#lotNumber = Lot.validateLotNumber(lotNumber);
    this.markAsUpdated();
  }

  /** Corrige a quantidade durante a conferência (RECEIVED ou UNDER_INSPECTION). */
  changeQuantity(quantity: number): void {
    this.ensureEditable('alterar a quantidade');
    this.#quantity = Lot.validateQuantity(quantity);
    this.markAsUpdated();
  }

  /** RECEIVED -> UNDER_INSPECTION */
  startInspection(): void {
    this.transition([LotStatus.RECEIVED], LotStatus.UNDER_INSPECTION, 'iniciar a inspeção de');
  }

  /** UNDER_INSPECTION -> AVAILABLE */
  approve(): void {
    this.transition([LotStatus.UNDER_INSPECTION], LotStatus.AVAILABLE, 'aprovar');
  }

  /** AVAILABLE -> RESERVED, vinculado à operação informada. */
  reserve(operationId: string): void {
    const validatedOperationId = Lot.validateOperationId(operationId);

    this.transition([LotStatus.AVAILABLE], LotStatus.RESERVED, 'reservar');
    this.#reservedForOperationId = validatedOperationId;
  }

  /** RESERVED -> AVAILABLE */
  cancelReservation(): void {
    this.transition([LotStatus.RESERVED], LotStatus.AVAILABLE, 'cancelar a reserva de');
    this.#reservedForOperationId = null;
  }

  /** AVAILABLE -> IN_STORAGE */
  store(): void {
    this.transition([LotStatus.AVAILABLE], LotStatus.IN_STORAGE, 'armazenar');
  }

  /** IN_STORAGE -> AVAILABLE */
  withdrawFromStorage(): void {
    this.transition([LotStatus.IN_STORAGE], LotStatus.AVAILABLE, 'retirar do armazenamento');
  }

  /** Qualquer status não final (exceto EXPIRED) -> QUARANTINED. Uma reserva ativa é desfeita. */
  quarantine(): void {
    this.transition(
      [
        LotStatus.RECEIVED,
        LotStatus.UNDER_INSPECTION,
        LotStatus.AVAILABLE,
        LotStatus.RESERVED,
        LotStatus.IN_STORAGE,
      ],
      LotStatus.QUARANTINED,
      'colocar em quarentena',
    );
    this.#reservedForOperationId = null;
  }

  /** QUARANTINED -> AVAILABLE */
  releaseFromQuarantine(): void {
    this.transition([LotStatus.QUARANTINED], LotStatus.AVAILABLE, 'liberar da quarentena');
  }

  /**
   * Saída definitiva do porto. Exige que o lote possa ser movimentado pela
   * operação informada: AVAILABLE sempre pode; RESERVED só pela operação que
   * o reservou.
   */
  release(operationId?: string): void {
    this.ensureCanBeMovedBy(operationId);
    this.changeStatus(LotStatus.RELEASED);
    this.#reservedForOperationId = null;
  }

  /** Qualquer status não final -> EXPIRED. Uma reserva ativa é desfeita. */
  expire(): void {
    this.transition(
      [
        LotStatus.RECEIVED,
        LotStatus.UNDER_INSPECTION,
        LotStatus.AVAILABLE,
        LotStatus.RESERVED,
        LotStatus.IN_STORAGE,
        LotStatus.QUARANTINED,
      ],
      LotStatus.EXPIRED,
      'marcar como vencido',
    );
    this.#reservedForOperationId = null;
  }

  /** QUARANTINED ou EXPIRED -> DISPOSED */
  dispose(): void {
    this.transition([LotStatus.QUARANTINED, LotStatus.EXPIRED], LotStatus.DISPOSED, 'descartar');
  }

  /**
   * Regra central de movimentação: AVAILABLE pode ser movimentado por qualquer
   * operação; RESERVED apenas pela operação que o reservou; os demais, nunca.
   */
  canBeMovedBy(operationId?: string): boolean {
    if (this.#status === LotStatus.AVAILABLE) {
      return true;
    }

    if (this.#status === LotStatus.RESERVED) {
      return operationId !== undefined && operationId === this.#reservedForOperationId;
    }

    return false;
  }

  isTerminal(): boolean {
    return TERMINAL_STATUSES.has(this.#status);
  }

  toObject(): LotProperties {
    return {
      id: this.id,
      chemicalProductId: this.chemicalProductId,
      lotNumber: this.#lotNumber,
      quantity: this.#quantity,
      status: this.#status,
      reservedForOperationId: this.#reservedForOperationId,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
    };
  }

  private transition(allowedFrom: LotStatus[], to: LotStatus, action: string): void {
    if (!allowedFrom.includes(this.#status)) {
      throw new BusinessRuleError(
        `Não é possível ${action} um lote com status ${this.#status}.`,
      );
    }

    this.changeStatus(to);
  }

  private ensureCanBeMovedBy(operationId?: string): void {
    if (this.canBeMovedBy(operationId)) {
      return;
    }

    if (this.#status === LotStatus.RESERVED) {
      throw new BusinessRuleError(
        `O lote está reservado para a operação "${this.#reservedForOperationId}" e só pode ser movimentado por ela.`,
      );
    }

    throw new BusinessRuleError(`Um lote com status ${this.#status} não pode ser movimentado.`);
  }

  private ensureEditable(action: string): void {
    if (!EDITABLE_STATUSES.has(this.#status)) {
      throw new BusinessRuleError(
        `Não é possível ${action} de um lote com status ${this.#status}; isso só é permitido durante a conferência.`,
      );
    }
  }

  private changeStatus(status: LotStatus): void {
    this.#status = status;
    this.markAsUpdated();
  }

  private markAsUpdated(): void {
    this.#updatedAt = new Date();
  }

  private static validateProductId(productId: string): string {
    const normalizedId = productId?.trim() ?? '';

    if (normalizedId.length === 0) {
      throw new BusinessRuleError('O lote deve pertencer a um produto químico.');
    }

    return normalizedId;
  }

  private static validateLotNumber(lotNumber: string): string {
    const normalizedLotNumber = lotNumber?.trim().toUpperCase() ?? '';

    if (normalizedLotNumber.length === 0) {
      throw new BusinessRuleError('O número do lote não pode ser vazio.');
    }

    if (normalizedLotNumber.length > MAX_LOT_NUMBER_LENGTH) {
      throw new BusinessRuleError(
        `O número do lote deve ter no máximo ${MAX_LOT_NUMBER_LENGTH} caracteres.`,
      );
    }

    if (!LOT_NUMBER_FORMAT.test(normalizedLotNumber)) {
      throw new BusinessRuleError(
        `O número do lote "${lotNumber}" não é válido: use apenas letras, números, ponto, hífen, barra ou sublinhado.`,
      );
    }

    return normalizedLotNumber;
  }

  private static validateQuantity(quantity: number): number {
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      throw new BusinessRuleError('A quantidade do lote deve ser um número maior que zero.');
    }

    return quantity;
  }

  private static validateOperationId(operationId: string): string {
    const normalizedId = operationId?.trim() ?? '';

    if (normalizedId.length === 0) {
      throw new BusinessRuleError('A reserva de um lote exige a identificação da operação.');
    }

    if (normalizedId.length > MAX_OPERATION_ID_LENGTH) {
      throw new BusinessRuleError(
        `A identificação da operação deve ter no máximo ${MAX_OPERATION_ID_LENGTH} caracteres.`,
      );
    }

    return normalizedId;
  }
}
