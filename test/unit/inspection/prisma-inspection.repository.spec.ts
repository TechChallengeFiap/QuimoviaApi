import { jest } from '@jest/globals';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { PrismaInspectionRepository } from '@/modules/inspection/infrastructure/persistence/prisma/prisma-inspection.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

type PrismaMethod = (args: unknown) => Promise<unknown>;

/** Substitui o PrismaService, já que os testes não acessam o banco. */
function createPrismaFake() {
  return {
    inspection: {
      create: jest.fn<PrismaMethod>(),
      update: jest.fn<PrismaMethod>(),
      delete: jest.fn<PrismaMethod>(),
      findUnique: jest.fn<PrismaMethod>(),
      findMany: jest.fn<PrismaMethod>(),
      count: jest.fn<PrismaMethod>(),
    },
  };
}

const INCLUDE_ITEMS_AND_RELATIONS = {
  items: { orderBy: { requirement: 'asc' } },
  cargo: {
    include: {
      product: true,
      responsibleUser: true,
    },
  },
  inspector: true,
};

const persisted = {
  id: 'inspection-001',
  cargoId: 'cargo-001',
  compositionVersion: 2,
  scope: 'CARGO_ITEM',
  cargoItemId: 'item-001',
  inspectorId: 'fiscal-001',
  status: 'IN_PROGRESS',
  startedAt: new Date('2026-09-30T13:00:00Z'),
  completedAt: null,
  createdAt: new Date('2026-09-30T12:00:00Z'),
  updatedAt: new Date('2026-09-30T13:00:00Z'),
  items: [
    {
      id: 'item-a',
      inspectionId: 'inspection-001',
      requirement: 'NO_LEAKAGE',
      result: 'NON_COMPLIANT',
      observation: 'Vazamento no tambor 3',
    },
    {
      id: 'item-b',
      inspectionId: 'inspection-001',
      requirement: 'CORRECT_LABELING',
      result: null,
      observation: null,
    },
  ],
  cargo: null,
  inspector: null,
};

const persistedWithRelations = {
  ...persisted,
  cargo: {
    id: 'cargo-001',
    productId: 'prod-001',
    quantityProduct: 100,
    status: 'ANALYZING',
    responsibleUserId: 'user-001',
    responsibleUser: {
      id: 'user-001',
      name: 'João Responsável',
      email: 'joao@quimovia.com',
      passwordHash: 'hash',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z'),
    },
    documentsIds: 'doc-001',
    createdAt: new Date('2026-09-01T10:00:00Z'),
    updatedAt: new Date('2026-09-01T10:00:00Z'),
    deletedAt: null,
  },
  inspector: {
    id: 'fiscal-001',
    name: 'Carlos Fiscal',
    email: 'carlos.fiscal@quimovia.com',
    passwordHash: 'hash',
    role: 'PORT_OPERATOR',
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    updatedAt: new Date('2026-09-01T10:00:00Z'),
  },
};

describe('PrismaInspectionRepository', () => {
  let prisma: ReturnType<typeof createPrismaFake>;
  let repository: PrismaInspectionRepository;

  beforeEach(() => {
    prisma = createPrismaFake();
    repository = new PrismaInspectionRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('grava a inspeção junto com as verificações previstas', async () => {
    const inspection = Inspection.create({
      cargoId: 'cargo-001',
      compositionVersion: 1,
      scope: InspectionScope.CARGO,
      inspectorId: 'fiscal-001',
      requirements: [InspectionRequirement.NO_LEAKAGE],
    });
    prisma.inspection.create.mockResolvedValueOnce(persisted);

    await repository.create(inspection);

    expect(prisma.inspection.create).toHaveBeenCalledWith({
      data: {
        id: inspection.id,
        cargoId: 'cargo-001',
        compositionVersion: 1,
        scope: InspectionScope.CARGO,
        cargoItemId: null,
        inspectorId: 'fiscal-001',
        status: InspectionStatus.PENDING,
        startedAt: null,
        completedAt: null,
        items: {
          create: [
            {
              requirement: InspectionRequirement.NO_LEAKAGE,
              result: null,
              observation: null,
            },
          ],
        },
      },
      include: INCLUDE_ITEMS_AND_RELATIONS,
    });
  });

  it('converte o registro persistido para o agregado', async () => {
    prisma.inspection.findUnique.mockResolvedValueOnce(persisted);

    const inspection = await repository.findById('inspection-001');

    expect(prisma.inspection.findUnique).toHaveBeenCalledWith({
      where: { id: 'inspection-001' },
      include: INCLUDE_ITEMS_AND_RELATIONS,
    });
    expect(inspection?.toObject()).toMatchObject({
      id: 'inspection-001',
      scope: InspectionScope.CARGO_ITEM,
      cargoItemId: 'item-001',
      status: InspectionStatus.IN_PROGRESS,
    });
    expect(inspection?.items.map((item) => item.toObject())).toEqual([
      {
        requirement: InspectionRequirement.NO_LEAKAGE,
        result: InspectionItemResult.NON_COMPLIANT,
        observation: 'Vazamento no tambor 3',
      },
      {
        requirement: InspectionRequirement.CORRECT_LABELING,
        result: null,
        observation: null,
      },
    ]);
  });

  it('converte as relações de cargo e inspector para as entidades de domínio', async () => {
    prisma.inspection.findUnique.mockResolvedValueOnce(persistedWithRelations);

    const inspection = await repository.findById('inspection-001');

    expect(inspection?.cargo).toBeInstanceOf(ChemicalShipment);
    expect(inspection?.cargo?.id).toBe('cargo-001');
    expect(inspection?.cargo?.responsibleUser).toBeInstanceOf(User);
    expect(inspection?.inspector).toBeInstanceOf(User);
    expect(inspection?.inspector?.name).toBe('Carlos Fiscal');
  });

  it('retorna null quando a inspeção não existe', async () => {
    prisma.inspection.findUnique.mockResolvedValueOnce(null);

    await expect(repository.findById('id-inexistente')).resolves.toBeNull();
  });

  it('atualiza os resultados identificando cada verificação pela inspeção e pelo requisito', async () => {
    prisma.inspection.findUnique.mockResolvedValueOnce(persisted);
    const inspection = await repository.findById('inspection-001');
    inspection!.recordResult(
      InspectionRequirement.CORRECT_LABELING,
      InspectionItemResult.COMPLIANT,
    );
    prisma.inspection.update.mockResolvedValueOnce(persisted);

    await repository.update(inspection!);

    expect(prisma.inspection.update).toHaveBeenCalledWith({
      where: { id: 'inspection-001' },
      data: {
        inspectorId: 'fiscal-001',
        status: InspectionStatus.IN_PROGRESS,
        startedAt: persisted.startedAt,
        completedAt: null,
        items: {
          update: [
            {
              where: {
                inspectionId_requirement: {
                  inspectionId: 'inspection-001',
                  requirement: InspectionRequirement.NO_LEAKAGE,
                },
              },
              data: {
                result: InspectionItemResult.NON_COMPLIANT,
                observation: 'Vazamento no tambor 3',
              },
            },
            {
              where: {
                inspectionId_requirement: {
                  inspectionId: 'inspection-001',
                  requirement: InspectionRequirement.CORRECT_LABELING,
                },
              },
              data: {
                result: InspectionItemResult.COMPLIANT,
                observation: null,
              },
            },
          ],
        },
      },
      include: INCLUDE_ITEMS_AND_RELATIONS,
    });
  });

  it('aplica os filtros e a paginação na listagem', async () => {
    prisma.inspection.findMany.mockResolvedValueOnce([persisted]);
    prisma.inspection.count.mockResolvedValueOnce(21);

    const page = await repository.list({
      cargoId: 'cargo-001',
      status: InspectionStatus.IN_PROGRESS,
      page: 2,
      pageSize: 20,
    });

    const where = {
      cargoId: 'cargo-001',
      status: InspectionStatus.IN_PROGRESS,
    };
    expect(prisma.inspection.findMany).toHaveBeenCalledWith({
      where,
      include: INCLUDE_ITEMS_AND_RELATIONS,
      orderBy: { createdAt: 'desc' },
      skip: 20,
      take: 20,
    });
    expect(prisma.inspection.count).toHaveBeenCalledWith({ where });
    expect(page).toMatchObject({ total: 21, page: 2, pageSize: 20 });
    expect(page.items).toHaveLength(1);
  });

  it('remove a inspeção pelo id', async () => {
    prisma.inspection.delete.mockResolvedValueOnce(persisted);

    await repository.remove('inspection-001');

    expect(prisma.inspection.delete).toHaveBeenCalledWith({
      where: { id: 'inspection-001' },
    });
  });
});
