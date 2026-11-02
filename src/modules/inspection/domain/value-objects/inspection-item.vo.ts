import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';

const MAX_OBSERVATION_LENGTH = 500;

export interface InspectionItemProperties {
  requirement: InspectionRequirement;
  result: InspectionItemResult | null;
  observation: string | null;
}

/**
 * Verificação prevista na inspeção, com o resultado registrado pelo Fiscal.
 *
 * O item de inspeção é uma verificação a realizar, não um item transportado
 * na carga. Como objeto de valor, é imutável: registrar um resultado produz um
 * novo item, aplicado pela raiz do agregado.
 */
export class InspectionItem {
  readonly requirement: InspectionRequirement;
  readonly result: InspectionItemResult | null;
  readonly observation: string | null;

  private constructor(properties: InspectionItemProperties) {
    this.requirement = properties.requirement;
    this.result = properties.result;
    this.observation = properties.observation;
  }

  /** Cria uma verificação prevista, ainda sem resultado. */
  static pending(requirement: InspectionRequirement): InspectionItem {
    return new InspectionItem({ requirement, result: null, observation: null });
  }

  /** Reconstrói uma verificação já persistida, sem revalidar os dados. */
  static restore(properties: InspectionItemProperties): InspectionItem {
    return new InspectionItem(properties);
  }

  get hasResult(): boolean {
    return this.result !== null;
  }

  /**
   * Registra o resultado da verificação. Uma não conformidade exige a
   * descrição da irregularidade encontrada.
   */
  withResult(
    result: InspectionItemResult,
    observation?: string | null,
  ): InspectionItem {
    const normalizedObservation = observation?.trim() || null;

    if (
      result === InspectionItemResult.NON_COMPLIANT &&
      normalizedObservation === null
    ) {
      throw new BusinessRuleError(
        `A não conformidade na verificação ${this.requirement} exige a descrição da irregularidade.`,
      );
    }

    if (
      normalizedObservation !== null &&
      normalizedObservation.length > MAX_OBSERVATION_LENGTH
    ) {
      throw new BusinessRuleError(
        `A observação deve ter no máximo ${MAX_OBSERVATION_LENGTH} caracteres.`,
      );
    }

    return new InspectionItem({
      requirement: this.requirement,
      result,
      observation: normalizedObservation,
    });
  }

  toObject(): InspectionItemProperties {
    return {
      requirement: this.requirement,
      result: this.result,
      observation: this.observation,
    };
  }
}
