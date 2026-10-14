import { randomUUID } from 'node:crypto';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

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

/**
 * Raiz do agregado Carga Química.
 *
 * O estado só muda pelos métodos da entidade: uma carga aprovada ou reprovada
 * não pode mais ser alterada, e os identificadores obrigatórios nunca ficam
 * vazios.
 *
 * O responsável é outro agregado, de outro contexto (Identidade e Acesso), e
 * por isso é referenciado apenas pelo identificador.
 */
export class ChemicalShipment {
  readonly id: string;
  readonly createdAt: Date;

  #productId: string;
  #status: StatusShipment;
  #responsibleUserId: string;
  #documentsIds: string;
  #updatedAt: Date;
  #deletedAt: Date | null;

  private constructor(properties: ChemicalShipmentProperties) {
    this.id = properties.id;
    this.createdAt = properties.createdAt;
    this.#productId = properties.productId;
    this.#status = properties.status;
    this.#responsibleUserId = properties.responsibleUserId;
    this.#documentsIds = properties.documentsIds;
    this.#updatedAt = properties.updatedAt;
    this.#deletedAt = properties.deletedAt;
  }

  /** Cria uma nova carga em análise, validando os dados informados. */
  static create(data: CreateChemicalShipmentData): ChemicalShipment {
    const productId = ChemicalShipment.validateRequired(
      data.productId,
      'productId',
    );
    const responsibleUserId = ChemicalShipment.validateRequired(
      data.responsibleUserId,
      'responsibleUserId',
    );
    const documentsIds = ChemicalShipment.validateRequired(
      data.documentsIds,
      'documentsIds',
    );
    const now = new Date();

    return new ChemicalShipment({
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: StatusShipment.ANALYZING,
      productId,
      responsibleUserId,
      documentsIds,
    });
  }

  /** Reconstrói uma carga já persistida, sem revalidar os dados. */
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

  get documentsIds(): string {
    return this.#documentsIds;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  get deletedAt(): Date | null {
    return this.#deletedAt;
  }

  changeStatus(status: StatusShipment): void {
    this.ensureCanBeChanged();
    this.#status = status;
    this.markAsUpdated();
  }

  changeProduct(productId: string): void {
    this.ensureCanBeChanged();
    this.#productId = ChemicalShipment.validateRequired(productId, 'productId');
    this.markAsUpdated();
  }

  changeResponsibleUser(responsibleUserId: string): void {
    this.ensureCanBeChanged();
    this.#responsibleUserId = ChemicalShipment.validateRequired(
      responsibleUserId,
      'responsibleUserId',
    );
    this.markAsUpdated();
  }

  changeDocuments(documentsIds: string): void {
    this.ensureCanBeChanged();
    this.#documentsIds = ChemicalShipment.validateRequired(
      documentsIds,
      'documentsIds',
    );
    this.markAsUpdated();
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
    };
  }

  /** Uma carga aprovada ou reprovada já foi decidida e não muda mais. */
  private ensureCanBeChanged(): void {
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

  private markAsUpdated(): void {
    this.#updatedAt = new Date();
  }

  private static validateRequired(value: string, field: string): string {
    if (!value) {
      throw new BusinessRuleError(`O ${field} não pode estar vazio`);
    }

    return value;
  }
}
