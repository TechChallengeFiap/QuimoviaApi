import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { CreateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/create-inspection.use-case.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import { InspectionRepositoryMock } from '../../../mocks/inspection-repository.mock.js';

describe('CreateInspectionUseCase', () => {
  let inspections: InspectionRepositoryMock;
  let useCase: CreateInspectionUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  const input = {
    cargoId: 'cargo-001',
    compositionVersion: 1,
    scope: InspectionScope.CARGO,
    inspectorId: 'fiscal-001',
    requirements: [InspectionRequirement.NO_LEAKAGE],
  };

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    inspections = new InspectionRepositoryMock();
    useCase = new CreateInspectionUseCase(inspections);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cadastra uma inspeção pendente', async () => {
    const inspection = await useCase.execute(input);

    expect(inspection.status).toBe(InspectionStatus.PENDING);
    expect(await inspections.findById(inspection.id)).not.toBeNull();
  });

  it('rejeita escopo de item da carga sem o identificador do item', async () => {
    await expect(
      useCase.execute({ ...input, scope: InspectionScope.CARGO_ITEM }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(inspections, 'create').mockRejectedValueOnce(failure);

    await expect(useCase.execute(input)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao cadastrar a inspeção: Falha de conexão com o banco',
      failure.stack,
    );
  });
});
