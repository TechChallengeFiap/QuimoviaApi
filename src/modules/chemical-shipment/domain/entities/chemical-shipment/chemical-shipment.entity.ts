import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { randomUUID } from 'crypto';

import { User } from '@/modules/user/domain/entities/user.entity.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';

import {
  STATUS_SHIPMENT_LABELS,
  StatusShipment,
} from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import {
  assertTransitionAllowed,
  isTerminalStatus,
} from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/shipment-status-transitions.js';

export interface CreateChemicalShipmentData {
  productId: string;
  responsibleUserId: string;
  documentsIds: string;
  quantityProduct: number;
}

export interface ChemicalShipmentProperties {
  id: string;
  createdAt: Date;
  productId: string;
  product?: ChemicalProduct | null;
  quantityProduct: number;
  status: StatusShipment;
  responsibleUserId: string;
  responsibleUser?: User | null;
  documentsIds: string;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface StatusChangeFacts {
  hasRequiredDocumentation?: boolean;
}
const EDITABLE_STATUSES: readonly StatusShipment[] = [
  StatusShipment.REGISTERED,
  StatusShipment.ANALYZING,
];

export class ChemicalShipment {
  readonly id: string;
  readonly createdAt: Date;

  #productId: string;
  #product?: ChemicalProduct | null;
  #quantityProduct: number;
  #status: StatusShipment;
  #responsibleUserId: string;
  #responsibleUser?: User | null;
  #documentsIds: string;
  #updatedAt: Date;
  #deletedAt: Date | null;

  private constructor(props: ChemicalShipmentProperties) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.#productId = props.productId;
    this.#product = props.product ?? null;
    this.#quantityProduct = props.quantityProduct;
    this.#status = props.status;
    this.#responsibleUserId = props.responsibleUserId;
    this.#responsibleUser = props.responsibleUser ?? null;
    this.#documentsIds = props.documentsIds;
    this.#updatedAt = props.updatedAt;
    this.#deletedAt = props.deletedAt;
  }

  static create(data: CreateChemicalShipmentData): ChemicalShipment {
    const now = new Date();

    if (
      data.quantityProduct === undefined ||
      data.quantityProduct === null ||
      data.quantityProduct <= 0
    ) {
      throw new BusinessRuleError(
        'A quantidade do produto não pode ser 0 e nem negativa',
      );
    }

    return new ChemicalShipment({
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: StatusShipment.REGISTERED,
      ...data,
    });
  }

  changeStatus(target: StatusShipment, facts: StatusChangeFacts = {}): void {
    assertTransitionAllowed(this.#status, target);
    if (target === StatusShipment.APPROVED && !facts.hasRequiredDocumentation) {
      throw new BusinessRuleError(
        'Uma carga não pode ser liberada sem documentação obrigatória.',
      );
    }
    this.#status = target;
    this.#updatedAt = new Date();
  }

  startAnalysis(): void {
    this.changeStatus(StatusShipment.ANALYZING);
  }
  sendToInspection(): void {
    this.changeStatus(StatusShipment.INSPECTION);
  }
  release(hasRequiredDocumentation: boolean): void {
    this.changeStatus(StatusShipment.APPROVED, { hasRequiredDocumentation });
  }
  block(): void {
    this.changeStatus(StatusShipment.REPROVED);
  }
  startTransit(): void {
    this.changeStatus(StatusShipment.IN_TRANSIT);
  }
  complete(): void {
    this.changeStatus(StatusShipment.COMPLETED);
  }
  cancel(): void {
    this.changeStatus(StatusShipment.CANCELLED);
  }

  get isTerminal(): boolean {
    return isTerminalStatus(this.#status);
  }

  changeProduct(productId: string): void {
    this.validateCanBeUpdated();
    this.#productId = productId;
    this.#updatedAt = new Date();
  }

  changeResponsibleUser(responsibleUserId: string): void {
    this.validateCanBeUpdated();
    this.#responsibleUserId = responsibleUserId;
    this.#updatedAt = new Date();
  }

  changeDocuments(documentsIds: string): void {
    this.validateCanBeUpdated();
    this.#documentsIds = documentsIds;
    this.#updatedAt = new Date();
  }

  changeQuantityProduct(quantityProduct: number): void {
    this.validateCanBeUpdated();
    if (quantityProduct <= 0) {
      throw new BusinessRuleError(
        'A quantidade do produto não pode ser 0 e nem negativa',
      );
    }
    this.#quantityProduct = quantityProduct;
    this.#updatedAt = new Date();
  }

  private validateCanBeUpdated(): void {
    if (!EDITABLE_STATUSES.includes(this.#status)) {
      throw new BusinessRuleError(
        `Os dados da carga só podem ser alterados enquanto ela está "Registrada" ou "Em análise" (status atual: "${STATUS_SHIPMENT_LABELS[this.#status]}").`,
      );
    }
  }

  static restore(properties: ChemicalShipmentProperties): ChemicalShipment {
    return new ChemicalShipment(properties);
  }

  get productId(): string {
    return this.#productId;
  }

  get product(): ChemicalProduct | null | undefined {
    return this.#product;
  }

  get quantityProduct(): number {
    return this.#quantityProduct;
  }

  get status(): StatusShipment {
    return this.#status;
  }

  get responsibleUserId(): string {
    return this.#responsibleUserId;
  }

  get responsibleUser(): User | null | undefined {
    return this.#responsibleUser;
  }

  get documentsIds(): string {
    return this.#documentsIds;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  get deletedAt(): Date | null {
    return this.#deletedAt;
  }

  set productId(productId: string) {
    this.#productId = productId;
  }

  set product(product: ChemicalProduct | null | undefined) {
    this.#product = product;
  }

  set quantityProduct(quantityProduct: number) {
    this.changeQuantityProduct(quantityProduct);
  }

  set responsibleUserId(responsibleUserId: string) {
    this.#responsibleUserId = responsibleUserId;
  }

  set responsibleUser(responsibleUser: User | null | undefined) {
    this.#responsibleUser = responsibleUser;
  }

  set documentsIds(documentsIds: string) {
    this.#documentsIds = documentsIds;
  }

  set updatedAt(updatedAt: Date) {
    this.#updatedAt = updatedAt;
  }

  set deletedAt(deletedAt: Date | null) {
    this.#deletedAt = deletedAt;
  }

  toObject(): ChemicalShipmentProperties {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
      status: this.#status,
      productId: this.#productId,
      product: this.#product,
      quantityProduct: this.#quantityProduct,
      responsibleUserId: this.#responsibleUserId,
      responsibleUser: this.#responsibleUser,
      documentsIds: this.#documentsIds,
      deletedAt: this.#deletedAt,
    };
  }
}
