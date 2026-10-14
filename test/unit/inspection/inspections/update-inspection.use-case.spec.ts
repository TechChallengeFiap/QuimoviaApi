import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { UpdateInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/update-inspection.use-case.js';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { InspectionRepositoryMock } from '../../../mocks/inspection-repository.mock.js';
import { buildInspection } from '../../../mocks/entities.mock.js';

describe('UpdateInspectionUseCase', () => {
  let inspections: InspectionRepositoryMock;
  let useCase: UpdateInspectionUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    inspections = new InspectionRepositoryMock();
    useCase = new UpdateInspectionUseCase(inspections);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerInspection(): Promise<Inspection> {
    return inspections.create(
      buildInspection({
        requirements: [
          InspectionRequirement.PACKAGING_INTEGRITY,
          InspectionRequirement.NO_LEAKAGE,
        ],
      }),
    );
  }

  it('lança erro quando a inspeção não existe', async () => {
    await expect(
      useCase.execute('id-inexistente', {
        status: InspectionStatus.IN_PROGRESS,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('inicia a inspeção e registra resultados na mesma requisição', async () => {
    const inspection = await registerInspection();

    const updated = await useCase.execute(inspection.id, {
      status: InspectionStatus.IN_PROGRESS,
      results: [
        {
          requirement: InspectionRequirement.PACKAGING_INTEGRITY,
          result: InspectionItemResult.COMPLIANT,
        },
      ],
    });

    expect(updated.status).toBe(InspectionStatus.IN_PROGRESS);
    expect(updated.startedAt).toEqual(expect.any(Date));
    expect(
      updated.items.find(
        (item) =>
          item.requirement === InspectionRequirement.PACKAGING_INTEGRITY,
      )?.result,
    ).toBe(InspectionItemResult.COMPLIANT);
  });

  it('registra os últimos resultados e conclui na mesma requisição', async () => {
    const inspection = await registerInspection();
    await useCase.execute(inspection.id, {
      status: InspectionStatus.IN_PROGRESS,
      results: [
        {
          requirement: InspectionRequirement.PACKAGING_INTEGRITY,
          result: InspectionItemResult.COMPLIANT,
        },
      ],
    });

    const completed = await useCase.execute(inspection.id, {
      status: InspectionStatus.COMPLETED,
      results: [
        {
          requirement: InspectionRequirement.NO_LEAKAGE,
          result: InspectionItemResult.NON_COMPLIANT,
          observation: 'Vazamento na válvula do tambor 3',
        },
      ],
    });

    expect(completed.status).toBe(InspectionStatus.COMPLETED);
    expect(completed.completedAt).toEqual(expect.any(Date));
  });

  it('não conclui com verificações sem resultado', async () => {
    const inspection = await registerInspection();

    await expect(
      useCase.execute(inspection.id, { status: InspectionStatus.IN_PROGRESS }),
    ).resolves.toBeDefined();
    await expect(
      useCase.execute(inspection.id, { status: InspectionStatus.COMPLETED }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('não permite que uma inspeção iniciada volte a ficar pendente', async () => {
    const inspection = await registerInspection();
    await useCase.execute(inspection.id, {
      status: InspectionStatus.IN_PROGRESS,
    });

    await expect(
      useCase.execute(inspection.id, { status: InspectionStatus.PENDING }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('reatribui o Fiscal enquanto a inspeção não está concluída', async () => {
    const inspection = await registerInspection();

    const updated = await useCase.execute(inspection.id, {
      inspectorId: 'fiscal-002',
    });

    expect(updated.inspectorId).toBe('fiscal-002');
  });

  it('registra o erro no log e o propaga quando a persistência falha', async () => {
    const inspection = await registerInspection();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(inspections, 'update').mockRejectedValueOnce(failure);

    await expect(
      useCase.execute(inspection.id, { status: InspectionStatus.IN_PROGRESS }),
    ).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao atualizar a inspeção com id ${inspection.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
