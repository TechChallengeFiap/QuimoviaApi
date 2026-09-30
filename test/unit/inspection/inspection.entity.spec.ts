import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

function createValidInspection(
  override: Partial<Parameters<typeof Inspection.create>[0]> = {},
) {
  return Inspection.create({
    cargoId: 'cargo-001',
    compositionVersion: 1,
    scope: InspectionScope.CARGO,
    inspectorId: 'fiscal-001',
    requirements: [
      InspectionRequirement.PACKAGING_INTEGRITY,
      InspectionRequirement.NO_LEAKAGE,
    ],
    ...override,
  });
}

function recordAllAsCompliant(inspection: Inspection): void {
  for (const item of inspection.items) {
    inspection.recordResult(item.requirement, InspectionItemResult.COMPLIANT);
  }
}

describe('Inspection', () => {
  describe('cadastro', () => {
    it('cria uma inspeção pendente com as verificações ainda sem resultado', () => {
      const inspection = createValidInspection();

      expect(inspection.id).toEqual(expect.any(String));
      expect(inspection.status).toBe(InspectionStatus.PENDING);
      expect(inspection.cargoItemId).toBeNull();
      expect(inspection.items.map((item) => item.toObject())).toEqual([
        {
          requirement: InspectionRequirement.PACKAGING_INTEGRITY,
          result: null,
          observation: null,
        },
        {
          requirement: InspectionRequirement.NO_LEAKAGE,
          result: null,
          observation: null,
        },
      ]);
    });

    it('exige o identificador do item na inspeção de um item da carga', () => {
      expect(() =>
        createValidInspection({ scope: InspectionScope.CARGO_ITEM }),
      ).toThrow(BusinessRuleError);

      const inspection = createValidInspection({
        scope: InspectionScope.CARGO_ITEM,
        cargoItemId: 'item-001',
      });

      expect(inspection.cargoItemId).toBe('item-001');
    });

    it('rejeita item da carga na inspeção da carga inteira', () => {
      expect(() => createValidInspection({ cargoItemId: 'item-001' })).toThrow(
        BusinessRuleError,
      );
    });

    it('exige ao menos uma verificação, sem repetições', () => {
      expect(() => createValidInspection({ requirements: [] })).toThrow(
        BusinessRuleError,
      );
      expect(() =>
        createValidInspection({
          requirements: [
            InspectionRequirement.NO_LEAKAGE,
            InspectionRequirement.NO_LEAKAGE,
          ],
        }),
      ).toThrow(BusinessRuleError);
    });

    it('rejeita versão da composição menor que 1 ou não inteira', () => {
      expect(() => createValidInspection({ compositionVersion: 0 })).toThrow(
        BusinessRuleError,
      );
      expect(() => createValidInspection({ compositionVersion: 1.5 })).toThrow(
        BusinessRuleError,
      );
    });

    it('rejeita identificadores vazios de carga e Fiscal', () => {
      expect(() => createValidInspection({ cargoId: '  ' })).toThrow(
        BusinessRuleError,
      );
      expect(() => createValidInspection({ inspectorId: '' })).toThrow(
        BusinessRuleError,
      );
    });
  });

  describe('ciclo de vida', () => {
    it('só registra resultados com a inspeção em andamento', () => {
      const inspection = createValidInspection();

      expect(() =>
        inspection.recordResult(
          InspectionRequirement.NO_LEAKAGE,
          InspectionItemResult.COMPLIANT,
        ),
      ).toThrow(BusinessRuleError);
    });

    it('inicia, registra os resultados e conclui a inspeção', () => {
      const inspection = createValidInspection();
      const startedAt = new Date('2026-09-30T10:00:00Z');
      const completedAt = new Date('2026-09-30T11:00:00Z');

      inspection.start(startedAt);
      recordAllAsCompliant(inspection);
      inspection.complete(completedAt);

      expect(inspection.status).toBe(InspectionStatus.COMPLETED);
      expect(inspection.startedAt).toEqual(startedAt);
      expect(inspection.completedAt).toEqual(completedAt);
      expect(inspection.items.every((item) => item.hasResult)).toBe(true);
    });

    it('não permite iniciar uma inspeção que já foi iniciada', () => {
      const inspection = createValidInspection();
      inspection.start();

      expect(() => inspection.start()).toThrow(BusinessRuleError);
    });

    it('rejeita resultado de verificação não prevista na inspeção', () => {
      const inspection = createValidInspection();
      inspection.start();

      expect(() =>
        inspection.recordResult(
          InspectionRequirement.SAFETY_EQUIPMENT,
          InspectionItemResult.COMPLIANT,
        ),
      ).toThrow(BusinessRuleError);
    });

    it('exige a descrição da irregularidade em uma não conformidade', () => {
      const inspection = createValidInspection();
      inspection.start();

      expect(() =>
        inspection.recordResult(
          InspectionRequirement.NO_LEAKAGE,
          InspectionItemResult.NON_COMPLIANT,
        ),
      ).toThrow(BusinessRuleError);

      inspection.recordResult(
        InspectionRequirement.NO_LEAKAGE,
        InspectionItemResult.NON_COMPLIANT,
        'Vazamento na válvula do tambor 3',
      );

      expect(
        inspection.items.find(
          (item) => item.requirement === InspectionRequirement.NO_LEAKAGE,
        )?.observation,
      ).toBe('Vazamento na válvula do tambor 3');
    });

    it('não conclui enquanto houver verificação sem resultado', () => {
      const inspection = createValidInspection();
      inspection.start();
      inspection.recordResult(
        InspectionRequirement.PACKAGING_INTEGRITY,
        InspectionItemResult.COMPLIANT,
      );

      expect(() => inspection.complete()).toThrow(/Pendentes: NO_LEAKAGE/);
    });

    it('não conclui uma inspeção que não está em andamento', () => {
      expect(() => createValidInspection().complete()).toThrow(
        BusinessRuleError,
      );
    });

    it('não permite alterar o Fiscal de uma inspeção concluída', () => {
      const inspection = createValidInspection();
      inspection.assignInspector('fiscal-002');
      inspection.start();
      recordAllAsCompliant(inspection);
      inspection.complete();

      expect(inspection.inspectorId).toBe('fiscal-002');
      expect(() => inspection.assignInspector('fiscal-003')).toThrow(
        BusinessRuleError,
      );
    });

    it('só permite remover inspeções pendentes', () => {
      const inspection = createValidInspection();
      expect(inspection.canBeRemoved()).toBe(true);

      inspection.start();
      expect(inspection.canBeRemoved()).toBe(false);
    });
  });
});
