import { jest } from '@jest/globals';
import {
  ChemicalShipment,
  type ChemicalShipmentProperties,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { PrismaChemicalShipmentRepository } from '@/modules/chemical-shipment/infrastructure/persistence/prisma/prisma-chemical-shipment.repository.js';
import type { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

type PrismaMethod = (args: unknown) => Promise<unknown>;

/** Substitui o PrismaService, já que os testes não acessam o banco. */
function createPrismaFake() {
  return {
    chemicalShipment: {
      create: jest.fn<PrismaMethod>(),
      update: jest.fn<PrismaMethod>(),
      findUnique: jest.fn<PrismaMethod>(),
      findMany: jest.fn<PrismaMethod>(),
      count: jest.fn<PrismaMethod>(),
    },
  };
}

const createdAt = new Date('2026-10-01T12:00:00.000Z');

function persistedShipment(
  override: Partial<ChemicalShipmentProperties> = {},
): ChemicalShipmentProperties {
  return {
    id: 'ship-1',
    productId: 'prod-001',
    status: StatusShipment.ANALYZING,
    responsibleUserId: 'user-001',
    documentsIds: 'doc-001',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    ...override,
  };
}

describe('PrismaChemicalShipmentRepository', () => {
  let prisma: ReturnType<typeof createPrismaFake>;
  let repository: PrismaChemicalShipmentRepository;

  beforeEach(() => {
    prisma = createPrismaFake();
    repository = new PrismaChemicalShipmentRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('busca a carga só na própria tabela, sem navegar até o usuário responsável', async () => {
    prisma.chemicalShipment.findUnique.mockResolvedValueOnce(
      persistedShipment(),
    );

    const shipment = await repository.findById('ship-1');

    expect(prisma.chemicalShipment.findUnique).toHaveBeenCalledWith({
      where: { id: 'ship-1' },
    });
    expect(shipment).toBeInstanceOf(ChemicalShipment);
    expect(shipment?.toObject()).toEqual(persistedShipment());
  });

  it('devolve null quando a carga não existe', async () => {
    prisma.chemicalShipment.findUnique.mockResolvedValueOnce(null);

    await expect(repository.findById('inexistente')).resolves.toBeNull();
  });

  it('lista com filtros e paginação, ignorando as cargas removidas', async () => {
    prisma.chemicalShipment.findMany.mockResolvedValueOnce([
      persistedShipment(),
    ]);
    prisma.chemicalShipment.count.mockResolvedValueOnce(3);

    const page = await repository.list({
      status: StatusShipment.ANALYZING,
      responsibleUserId: 'user-001',
      page: 2,
      pageSize: 1,
    });

    const where = {
      status: StatusShipment.ANALYZING,
      productId: undefined,
      responsibleUserId: 'user-001',
      documentsIds: undefined,
      deletedAt: null,
    };
    expect(prisma.chemicalShipment.findMany).toHaveBeenCalledWith({
      where,
      take: 1,
      skip: 1,
    });
    expect(prisma.chemicalShipment.count).toHaveBeenCalledWith({ where });
    expect(page).toMatchObject({ total: 3, page: 2, pageSize: 1 });
    expect(page.items[0]).toBeInstanceOf(ChemicalShipment);
  });

  it('grava as alterações da carga', async () => {
    const shipment = ChemicalShipment.restore(persistedShipment());
    shipment.changeStatus(StatusShipment.INSPECTION);
    prisma.chemicalShipment.update.mockResolvedValueOnce(
      persistedShipment({ status: StatusShipment.INSPECTION }),
    );

    const updated = await repository.update(shipment);

    expect(prisma.chemicalShipment.update).toHaveBeenCalledWith({
      where: { id: 'ship-1' },
      data: expect.objectContaining({
        status: StatusShipment.INSPECTION,
        responsibleUserId: 'user-001',
      }),
    });
    expect(updated.status).toBe(StatusShipment.INSPECTION);
  });

  it('remove logicamente, registrando a data de remoção', async () => {
    prisma.chemicalShipment.update.mockResolvedValueOnce(persistedShipment());

    await repository.delete('ship-1');

    expect(prisma.chemicalShipment.update).toHaveBeenCalledWith({
      where: { id: 'ship-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
