import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.ts';
import { randomUUID } from 'crypto';

export interface CreateChemicalShipmentData {
  productId: string;
  responsibleUserId: string;
  documentsIds: string;
}

export interface ChemicalShipmentProperties {
  id: string;
  createdAt: Date;
  productId: string;
  status: StatusShipment;
  responsibleUserId: string;
  documentsIds: string;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ChemicalShipment {
  readonly id: string;
  readonly createdAt: Date;

  #productId: string;
  #status: StatusShipment;
  #responsibleUserId: string;
  #documentsIds: string;
  #updatedAt: Date;
  #deletedAt: Date | null;

 private constructor(props: ChemicalShipmentProperties) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.#productId = props.productId;
    this.#status = props.status;
    this.#responsibleUserId = props.responsibleUserId;
    this.#documentsIds = props.documentsIds;
    this.#updatedAt = props.updatedAt;
    this.#deletedAt = props.deletedAt;
  }

  static create(data: CreateChemicalShipmentData): ChemicalShipment {
   const now = new Date();

   return new ChemicalShipment({
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    status: StatusShipment.ANALYZING,
    ...data
   })
  }

  static restore(properties: ChemicalShipmentProperties): ChemicalShipment {
    return new ChemicalShipment(properties);
  }

  get productId() : string {
    return this.#productId
  }

  get status() : StatusShipment {
    return this.#status
  }

  get responsibleUserId() : string {
    return this.#responsibleUserId
  }

  get documentsIds() : string {
    return this.#documentsIds
  }

  get updatedAt() : Date {
    return this.#updatedAt
  }

  get deletedAt() : Date | null {
    return this.#deletedAt
  }

  set productId(productId: string) {
    this.#productId = productId
  }

  set status(status: StatusShipment) {
    this.#status = status
  }

  set responsibleUserId(responsibleUserId: string) {
    this.#responsibleUserId = responsibleUserId
  }

  set documentsIds(documentsIds: string) {
    this.#documentsIds = documentsIds
  }

  set updatedAt(updatedAt: Date) {
    this.#updatedAt = updatedAt
  }

  set deletedAt(deletedAt: Date | null) {
    this.#deletedAt = deletedAt
  }

  toObject(): ChemicalShipmentProperties {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
      status: this.#status,
      productId: this.#productId,
      responsibleUserId: this.#responsibleUserId,
      documentsIds: this.#documentsIds,
      deletedAt: this.#deletedAt,
    }
  }
}
