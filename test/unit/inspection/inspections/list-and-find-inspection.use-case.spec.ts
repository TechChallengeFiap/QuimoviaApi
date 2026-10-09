import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { FindInspectionByIdUseCase } from '@/modules/inspection/application/use-cases/inspections/find-inspection-by-id.use-case.js';
import { ListInspectionsUseCase } from '@/modules/inspection/application/use-cases/inspections/list-inspections.use-case.js';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { ResourceNotFoundError } from '@/shared/domain/errors/domain.error.js';
import { InspectionRepositoryMock } from '../../../mocks/inspection-repository.mock.js';

let loggerError: jest.Spied<typeof Logger.prototype.error>;

beforeEach(() => {
  loggerError = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function newInspection(cargoId = 'cargo-001', inspectorId = 'fiscal-001') {
  return Inspection.create({
    cargoId,
    compositionVersion: 1,
    scope: InspectionScope.CARGO,
    inspectorId,
    requirements: [InspectionRequirement.NO_LEAKAGE],
  });
}

describe('FindInspectionByIdUseCase', () => {
  it('lança erro quando a inspeção não existe', async () => {
    const useCase = new FindInspectionByIdUseCase(
      new InspectionRepositoryMock(),
    );

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('retorna a inspeção quando ela existe', async () => {
    const inspections = new InspectionRepositoryMock();
    const inspection = await inspections.create(newInspection());

    const useCase = new FindInspectionByIdUseCase(inspections);

    await expect(useCase.execute(inspection.id)).resolves.toBe(inspection);
  });

  it('registra o erro no log e o propaga quando a busca falha', async () => {
    const inspections = new InspectionRepositoryMock();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(inspections, 'findById').mockRejectedValueOnce(failure);

    const useCase = new FindInspectionByIdUseCase(inspections);

    await expect(useCase.execute('id-qualquer')).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao buscar a inspeção com id id-qualquer: Falha de conexão com o banco',
      failure.stack,
    );
  });
});

describe('ListInspectionsUseCase', () => {
  it('aplica os valores padrão de paginação', async () => {
    const useCase = new ListInspectionsUseCase(new InspectionRepositoryMock());

    const result = await useCase.execute();

    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('filtra por carga, Fiscal e status', async () => {
    const inspections = new InspectionRepositoryMock();
    await inspections.create(newInspection('cargo-001', 'fiscal-001'));
    await inspections.create(newInspection('cargo-002', 'fiscal-001'));
    const started = newInspection('cargo-002', 'fiscal-002');
    started.start();
    await inspections.create(started);

    const useCase = new ListInspectionsUseCase(inspections);

    await expect(
      useCase.execute({ cargoId: 'cargo-002' }),
    ).resolves.toMatchObject({
      total: 2,
    });
    await expect(
      useCase.execute({ inspectorId: 'fiscal-001' }),
    ).resolves.toMatchObject({ total: 2 });

    const inProgress = await useCase.execute({
      status: InspectionStatus.IN_PROGRESS,
    });
    expect(inProgress.items).toEqual([started]);
  });

  it('registra o erro no log e o propaga quando a listagem falha', async () => {
    const inspections = new InspectionRepositoryMock();
    const failure = new Error('Falha de conexão com o banco');
    jest.spyOn(inspections, 'list').mockRejectedValueOnce(failure);

    const useCase = new ListInspectionsUseCase(inspections);

    await expect(useCase.execute()).rejects.toBe(failure);
    expect(loggerError).toHaveBeenCalledWith(
      'Erro ao listar as inspeções: Falha de conexão com o banco',
      failure.stack,
    );
  });
});
