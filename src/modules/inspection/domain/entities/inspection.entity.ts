import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { InspectionItem } from '@/modules/inspection/domain/value-objects/inspection-item.vo.js';

export interface InspectionProperties {
  id: string;
  shipmentId: string;
  compositionVersion: number;
  scope: InspectionScope;
  shipmentItemId: string | null;
  inspectorId: string;
  status: InspectionStatus;
  items: InspectionItem[];
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectionData {
  shipmentId: string;
  compositionVersion: number;
  scope: InspectionScope;
  shipmentItemId?: string | null;
  inspectorId: string;
  requirements: InspectionRequirement[];
}

/**
 * Raiz do agregado Inspeção.
 *
 * Cada inspeção identifica a carga, a versão da composição avaliada, um único
 * escopo, as verificações previstas e o Fiscal responsável. Os resultados só
 * são registrados com a inspeção em andamento, e a conclusão exige resultado
 * em todas as verificações. Depois de concluída, a inspeção não é mais
 * alterada: uma nova verificação deve ser registrada em outra inspeção.
 */
export class Inspection {
  readonly id: string;
  readonly shipmentId: string;
  readonly compositionVersion: number;
  readonly scope: InspectionScope;
  readonly shipmentItemId: string | null;
  readonly createdAt: Date;

  #inspectorId: string;
  #status: InspectionStatus;
  #items: InspectionItem[];
  #startedAt: Date | null;
  #completedAt: Date | null;
  #updatedAt: Date;

  private constructor(properties: InspectionProperties) {
    this.id = properties.id;
    this.shipmentId = properties.shipmentId;
    this.compositionVersion = properties.compositionVersion;
    this.scope = properties.scope;
    this.shipmentItemId = properties.shipmentItemId;
    this.createdAt = properties.createdAt;
    this.#inspectorId = properties.inspectorId;
    this.#status = properties.status;
    this.#items = [...properties.items];
    this.#startedAt = properties.startedAt;
    this.#completedAt = properties.completedAt;
    this.#updatedAt = properties.updatedAt;
  }

  /** Cria uma nova inspeção pendente, validando os dados informados. */
  static create(data: CreateInspectionData): Inspection {
    const now = new Date();

    return new Inspection({
      id: randomUUID(),
      shipmentId: Inspection.validateIdentifier(data.shipmentId, 'da carga'),
      compositionVersion: Inspection.validateCompositionVersion(
        data.compositionVersion,
      ),
      scope: data.scope,
      shipmentItemId: Inspection.validateShipmentItem(
        data.scope,
        data.shipmentItemId,
      ),
      inspectorId: Inspection.validateIdentifier(data.inspectorId, 'do Fiscal'),
      status: InspectionStatus.PENDING,
      items: Inspection.createItems(data.requirements),
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstrói uma inspeção já persistida, sem revalidar os dados. */
  static restore(properties: InspectionProperties): Inspection {
    return new Inspection(properties);
  }

  get inspectorId(): string {
    return this.#inspectorId;
  }

  get status(): InspectionStatus {
    return this.#status;
  }

  get items(): InspectionItem[] {
    return [...this.#items];
  }

  get startedAt(): Date | null {
    return this.#startedAt;
  }

  get completedAt(): Date | null {
    return this.#completedAt;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  assignInspector(inspectorId: string): void {
    this.ensureNotCompleted();
    this.#inspectorId = Inspection.validateIdentifier(inspectorId, 'do Fiscal');
    this.markAsUpdated();
  }

  start(at: Date = new Date()): void {
    if (this.#status !== InspectionStatus.PENDING) {
      throw new BusinessRuleError(
        'Apenas uma inspeção pendente pode ser iniciada.',
      );
    }

    this.#status = InspectionStatus.IN_PROGRESS;
    this.#startedAt = at;
    this.markAsUpdated();
  }

  recordResult(
    requirement: InspectionRequirement,
    result: InspectionItemResult,
    observation?: string | null,
  ): void {
    if (this.#status !== InspectionStatus.IN_PROGRESS) {
      throw new BusinessRuleError(
        'Os resultados só podem ser registrados com a inspeção em andamento.',
      );
    }

    const index = this.#items.findIndex(
      (item) => item.requirement === requirement,
    );

    if (index === -1) {
      throw new BusinessRuleError(
        `A verificação ${requirement} não está prevista nesta inspeção.`,
      );
    }

    const items = [...this.#items];
    items[index] = items[index].withResult(result, observation);
    this.#items = items;
    this.markAsUpdated();
  }

  /** A conclusão exige o resultado de todas as verificações previstas. */
  complete(at: Date = new Date()): void {
    if (this.#status !== InspectionStatus.IN_PROGRESS) {
      throw new BusinessRuleError(
        'Apenas uma inspeção em andamento pode ser concluída.',
      );
    }

    const pending = this.#items
      .filter((item) => !item.hasResult)
      .map((item) => item.requirement);

    if (pending.length > 0) {
      throw new BusinessRuleError(
        `A inspeção só pode ser concluída com o resultado de todas as verificações. Pendentes: ${pending.join(', ')}.`,
      );
    }

    this.#status = InspectionStatus.COMPLETED;
    this.#completedAt = at;
    this.markAsUpdated();
  }

  /**
   * Somente inspeções pendentes podem ser removidas; as demais fazem parte do
   * histórico de avaliação da carga.
   */
  canBeRemoved(): boolean {
    return this.#status === InspectionStatus.PENDING;
  }

  toObject(): InspectionProperties {
    return {
      id: this.id,
      shipmentId: this.shipmentId,
      compositionVersion: this.compositionVersion,
      scope: this.scope,
      shipmentItemId: this.shipmentItemId,
      inspectorId: this.#inspectorId,
      status: this.#status,
      items: this.items,
      startedAt: this.#startedAt,
      completedAt: this.#completedAt,
      createdAt: this.createdAt,
      updatedAt: this.#updatedAt,
    };
  }

  private ensureNotCompleted(): void {
    if (this.#status === InspectionStatus.COMPLETED) {
      throw new BusinessRuleError(
        'Uma inspeção concluída não pode ser alterada; registre uma nova inspeção.',
      );
    }
  }

  private markAsUpdated(): void {
    this.#updatedAt = new Date();
  }

  private static validateIdentifier(value: string, label: string): string {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      throw new BusinessRuleError(
        `O identificador ${label} não pode ser vazio.`,
      );
    }

    return normalizedValue;
  }

  private static validateCompositionVersion(version: number): number {
    if (!Number.isInteger(version) || version < 1) {
      throw new BusinessRuleError(
        'A versão da composição deve ser um número inteiro maior ou igual a 1.',
      );
    }

    return version;
  }

  /**
   * A inspeção de um item exige o identificador do item avaliado; a da carga
   * inteira não se refere a nenhum item específico.
   */
  private static validateShipmentItem(
    scope: InspectionScope,
    shipmentItemId: string | null | undefined,
  ): string | null {
    const normalizedShipmentItemId = shipmentItemId?.trim() || null;

    if (
      scope === InspectionScope.SHIPMENT_ITEM &&
      normalizedShipmentItemId === null
    ) {
      throw new BusinessRuleError(
        'A inspeção de um item da carga exige o identificador do item.',
      );
    }

    if (
      scope === InspectionScope.SHIPMENT &&
      normalizedShipmentItemId !== null
    ) {
      throw new BusinessRuleError(
        'A inspeção da carga inteira não deve informar um item da carga.',
      );
    }

    return normalizedShipmentItemId;
  }

  private static createItems(
    requirements: InspectionRequirement[],
  ): InspectionItem[] {
    if (requirements.length === 0) {
      throw new BusinessRuleError(
        'A inspeção deve prever ao menos uma verificação.',
      );
    }

    if (new Set(requirements).size !== requirements.length) {
      throw new BusinessRuleError(
        'A inspeção não pode prever a mesma verificação mais de uma vez.',
      );
    }

    return requirements.map((requirement) =>
      InspectionItem.pending(requirement),
    );
  }
}
