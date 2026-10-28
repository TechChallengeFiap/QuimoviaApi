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
  code?: string;
  unit?: string;
  origin?: string;
  destination?: string;
  entryDate?: Date | string;
}

export interface ChemicalShipmentProperties {
  id: string;
  code: string;
  createdAt: Date;
  productId: string;
  product?: ChemicalProduct | null;
  quantityProduct: number;
  unit: string;
  origin: string;
  destination: string;
  entryDate: Date;
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

  #code: string;
  #productId: string;
  #product?: ChemicalProduct | null;
  #quantityProduct: number;
  #unit: string;
  #origin: string;
  #destination: string;
  #entryDate: Date;
  #status: StatusShipment;
  #responsibleUserId: string;
  #responsibleUser?: User | null;
  #documentsIds: string;
  #updatedAt: Date;
  #deletedAt: Date | null;

  private constructor(props: ChemicalShipmentProperties) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.#code = props.code;
    this.#productId = props.productId;
    this.#product = props.product ?? null;
    this.#quantityProduct = props.quantityProduct;
    this.#unit = props.unit;
    this.#origin = props.origin;
    this.#destination = props.destination;
    this.#entryDate = props.entryDate;
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

    const code =
      data.code?.trim() ||
      `CARGO-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const unit = data.unit?.trim() || 'kg';
    const origin = data.origin?.trim() || 'Porto de Santos';
    const destination = data.destination?.trim() || 'Terminal Portuário';
    const entryDate = data.entryDate
      ? typeof data.entryDate === 'string'
        ? new Date(data.entryDate)
        : data.entryDate
      : now;

    return new ChemicalShipment({
      id: randomUUID(),
      code,
      productId: data.productId,
      responsibleUserId: data.responsibleUserId,
      documentsIds: data.documentsIds,
      quantityProduct: data.quantityProduct,
      unit,
      origin,
      destination,
      entryDate,
      status: StatusShipment.REGISTERED,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
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

  changeCode(code: string): void {
    this.validateCanBeUpdated();
    if (!code || !code.trim()) {
      throw new BusinessRuleError('O código da carga não pode ser vazio');
    }
    this.#code = code.trim();
    this.#updatedAt = new Date();
  }

  changeUnit(unit: string): void {
    this.validateCanBeUpdated();
    if (!unit || !unit.trim()) {
      throw new BusinessRuleError('A unidade de medida não pode ser vazia');
    }
    this.#unit = unit.trim();
    this.#updatedAt = new Date();
  }

  changeOrigin(origin: string): void {
    this.validateCanBeUpdated();
    if (!origin || !origin.trim()) {
      throw new BusinessRuleError('A origem da carga não pode ser vazia');
    }
    this.#origin = origin.trim();
    this.#updatedAt = new Date();
  }

  changeDestination(destination: string): void {
    this.validateCanBeUpdated();
    if (!destination || !destination.trim()) {
      throw new BusinessRuleError('O destino da carga não pode ser vazio');
    }
    this.#destination = destination.trim();
    this.#updatedAt = new Date();
  }

  changeEntryDate(entryDate: Date | string): void {
    this.validateCanBeUpdated();
    const date =
      typeof entryDate === 'string' ? new Date(entryDate) : entryDate;
    if (isNaN(date.getTime())) {
      throw new BusinessRuleError('A data de entrada informada é inválida');
    }
    this.#entryDate = date;
    this.#updatedAt = new Date();
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

  static restore(properties: Partial<ChemicalShipmentProperties> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: StatusShipment;
    productId: string;
    quantityProduct: number;
    responsibleUserId: string;
    documentsIds: string;
  }): ChemicalShipment {
    return new ChemicalShipment({
      id: properties.id,
      code:
        properties.code ||
        `CARGO-${properties.id.slice(0, 8).toUpperCase()}`,
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,
      status: properties.status,
      productId: properties.productId,
      product: properties.product,
      quantityProduct: properties.quantityProduct,
      unit: properties.unit || 'kg',
      origin: properties.origin || 'Porto de Santos',
      destination: properties.destination || 'Terminal Portuário',
      entryDate: properties.entryDate
        ? new Date(properties.entryDate)
        : properties.createdAt,
      responsibleUserId: properties.responsibleUserId,
      responsibleUser: properties.responsibleUser,
      documentsIds: properties.documentsIds,
      deletedAt: properties.deletedAt ?? null,
    });
  }

  get code(): string {
    return this.#code;
  }

  get unit(): string {
    return this.#unit;
  }

  get origin(): string {
    return this.#origin;
  }

  get destination(): string {
    return this.#destination;
  }

  get entryDate(): Date {
    return this.#entryDate;
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

  set code(code: string) {
    this.changeCode(code);
  }

  set unit(unit: string) {
    this.changeUnit(unit);
  }

  set origin(origin: string) {
    this.changeOrigin(origin);
  }

  set destination(destination: string) {
    this.changeDestination(destination);
  }

  set entryDate(entryDate: Date) {
    this.changeEntryDate(entryDate);
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
      code: this.#code,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
      status: this.#status,
      productId: this.#productId,
      product: this.#product,
      quantityProduct: this.#quantityProduct,
      unit: this.#unit,
      origin: this.#origin,
      destination: this.#destination,
      entryDate: this.#entryDate,
      responsibleUserId: this.#responsibleUserId,
      responsibleUser: this.#responsibleUser,
      documentsIds: this.#documentsIds,
      deletedAt: this.#deletedAt,
    };
  }
}
