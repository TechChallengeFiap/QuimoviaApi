import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionItem } from '@/modules/inspection/domain/value-objects/inspection-item.vo.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

describe('InspectionItem', () => {
  it('registra o resultado em um novo item, sem alterar o original', () => {
    const pending = InspectionItem.pending(InspectionRequirement.NO_LEAKAGE);

    const checked = pending.withResult(
      InspectionItemResult.COMPLIANT,
      '  Sem sinais de vazamento  ',
    );

    expect(pending.hasResult).toBe(false);
    expect(checked.toObject()).toEqual({
      requirement: InspectionRequirement.NO_LEAKAGE,
      result: InspectionItemResult.COMPLIANT,
      observation: 'Sem sinais de vazamento',
    });
  });

  it('exige observação quando a verificação não está conforme', () => {
    const pending = InspectionItem.pending(
      InspectionRequirement.CORRECT_LABELING,
    );

    expect(() =>
      pending.withResult(InspectionItemResult.NON_COMPLIANT, '   '),
    ).toThrow(BusinessRuleError);
  });

  it('limita a observação a 500 caracteres', () => {
    const pending = InspectionItem.pending(
      InspectionRequirement.CORRECT_LABELING,
    );

    expect(() =>
      pending.withResult(InspectionItemResult.COMPLIANT, 'a'.repeat(501)),
    ).toThrow(BusinessRuleError);
  });
});
