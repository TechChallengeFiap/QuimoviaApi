import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.ts';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.ts';
import { randomUUID } from 'crypto';

import { User } from '@/modules/user/domain/entities/user.entity.ts';

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
  responsibleUser?: User | null;
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
  #responsibleUser?: User | null;
  #documentsIds: string;
  #updatedAt: Date;
  #deletedAt: Date | null;

  private constructor(props: ChemicalShipmentProperties) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.#productId = props.productId;
    this.#status = props.status;
    this.#responsibleUserId = props.responsibleUserId;
    this.#responsibleUser = props.responsibleUser ?? null;
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
      ...data,
    });
  }

  updateChemicalShipmentStatus(
    chemicalShipment: ChemicalShipment,
    status: StatusShipment,
  ): void {
    this.validateCanBeUpdated(chemicalShipment);

    chemicalShipment.status = status;
    chemicalShipment.updatedAt = new Date();
  }

  changeChemicalShipmentProduct(
    chemicalShipment: ChemicalShipment,
    productId: string,
  ) {
    this.validateCanBeUpdated(chemicalShipment);

    this.#productId = productId;
    this.#updatedAt = new Date();
  }

  changeChemicalShipmentResponsibleUser(
    chemicalShipment: ChemicalShipment,
    responsibleUserId: string,
  ) {
    this.validateCanBeUpdated(chemicalShipment);

    this.#responsibleUserId = responsibleUserId;
    this.#updatedAt = new Date();
  }

  changeChemicalShipmentDocuments(
    chemicalShipment: ChemicalShipment,
    documentsIds: string,
  ) {
    this.validateCanBeUpdated(chemicalShipment);

    this.#documentsIds = documentsIds;
    this.#updatedAt = new Date();
  }

  private validateCanBeUpdated(chemicalShipment?: ChemicalShipment): void {
    const status = chemicalShipment ? chemicalShipment.status : this.#status;

    if (status === StatusShipment.REPROVED) {
      throw new BusinessRuleError(
        'Não é possível alterar uma carga química reprovada',
      );
    }

    if (status === StatusShipment.APPROVED) {
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
      responsibleUserId: this.#responsibleUserId,
      responsibleUser: this.#responsibleUser,
      documentsIds: this.#documentsIds,
      deletedAt: this.#deletedAt,
    };
  }
}
