import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { DeleteInspectionUseCase } from '@/modules/inspection/application/use-cases/inspections/delete-inspection.use-case.js';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { InspectionRepositoryMock } from '../../../mocks/inspection-repository.mock.js';

describe('DeleteInspectionUseCase', () => {
  let inspections: InspectionRepositoryMock;
  let useCase: DeleteInspectionUseCase;
  let loggerError: jest.Spied<typeof Logger.prototype.error>;

  beforeEach(() => {
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    inspections = new InspectionRepositoryMock();
    useCase = new DeleteInspectionUseCase(inspections);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function registerInspection(): Promise<Inspection> {
    return inspections.create(
      Inspection.create({
        cargoId: 'cargo-001',
        compositionVersion: 1,
        scope: InspectionScope.CARGO,
        inspectorId: 'fiscal-001',
        requirements: [InspectionRequirement.NO_LEAKAGE],
      }),
    );
  }

  it('lança erro quando a inspeção não existe', async () => {
    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('remove uma inspeção pendente', async () => {
    const inspection = await registerInspection();

    await useCase.execute(inspection.id);

    await expect(inspections.findById(inspection.id)).resolves.toBeNull();
  });

  it('não remove uma inspeção já iniciada', async () => {
    const inspection = await registerInspection();
    inspection.start();
    await inspections.update(inspection);

    await expect(useCase.execute(inspection.id)).rejects.toThrow(
      BusinessRuleError,
    );
    await expect(inspections.findById(inspection.id)).resolves.not.toBeNull();
  });

  it('registra o erro no log e o propaga quando a remoção falha', async () => {
    const inspection = await registerInspection();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(inspections, 'remove').mockRejectedValueOnce(failure);

    await expect(useCase.execute(inspection.id)).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      `Erro ao remover a inspeção com id ${inspection.id}: Falha de conexão com o banco`,
      failure.stack,
    );
  });
});
