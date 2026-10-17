import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { randomUUID } from 'crypto';

import { User } from '@/modules/user/domain/entities/user.entity.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';

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
      status: StatusShipment.ANALYZING,
      ...data,
    });
  }

  updateStatus(status: StatusShipment): void {
    this.validateCanBeUpdated();
    this.#status = status;
    this.#updatedAt = new Date();
  }

  updateChemicalShipmentStatus(
    arg1: ChemicalShipment | StatusShipment,
    arg2?: StatusShipment,
  ): void {
    const status = arg2 !== undefined ? arg2 : (arg1 as StatusShipment);
    this.updateStatus(status);
  }

  changeProduct(productId: string): void {
    this.validateCanBeUpdated();
    this.#productId = productId;
    this.#updatedAt = new Date();
  }

  changeChemicalShipmentProduct(
    arg1: ChemicalShipment | string,
    arg2?: string,
  ): void {
    const productId = typeof arg1 === 'string' ? arg1 : arg2!;
    this.changeProduct(productId);
  }

  changeResponsibleUser(responsibleUserId: string): void {
    this.validateCanBeUpdated();
    this.#responsibleUserId = responsibleUserId;
    this.#updatedAt = new Date();
  }

  changeChemicalShipmentResponsibleUser(
    arg1: ChemicalShipment | string,
    arg2?: string,
  ): void {
    const responsibleUserId = typeof arg1 === 'string' ? arg1 : arg2!;
    this.changeResponsibleUser(responsibleUserId);
  }

  changeDocuments(documentsIds: string): void {
    this.validateCanBeUpdated();
    this.#documentsIds = documentsIds;
    this.#updatedAt = new Date();
  }

  changeChemicalShipmentDocuments(
    arg1: ChemicalShipment | string,
    arg2?: string,
  ): void {
    const documentsIds = typeof arg1 === 'string' ? arg1 : arg2!;
    this.changeDocuments(documentsIds);
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
    if (this.#status === StatusShipment.REPROVED) {
      throw new BusinessRuleError(
        'Não é possível alterar uma carga química reprovada',
      );
    }

    if (this.#status === StatusShipment.APPROVED) {
      throw new BusinessRuleError(
        'Não é possível alterar uma carga química aprovada',
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

  set status(status: StatusShipment) {
    this.#status = status;
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
