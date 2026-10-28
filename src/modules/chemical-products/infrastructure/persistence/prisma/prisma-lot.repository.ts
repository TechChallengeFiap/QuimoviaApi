import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';
import type {
  LotPage,
  LotRepository,
  LotSearchFilters,
} from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import type { LotModel } from '@/generated/prisma/models.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

@Injectable()
export class PrismaLotRepository implements LotRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(lot: Lot): Promise<Lot> {
    const record = await this.prisma.lot.create({
      data: {
        id: lot.id,
        chemicalProductId: lot.chemicalProductId,
        ...PrismaLotRepository.toPersistence(lot),
      },
    });

    return PrismaLotRepository.toDomain(record);
  }

  async update(lot: Lot): Promise<Lot> {
    const record = await this.prisma.lot.update({
      where: { id: lot.id },
      data: PrismaLotRepository.toPersistence(lot),
    });

    return PrismaLotRepository.toDomain(record);
  }

  async findById(id: string): Promise<Lot | null> {
    const record = await this.prisma.lot.findUnique({ where: { id } });

    return record ? PrismaLotRepository.toDomain(record) : null;
  }

  async findByProductAndLotNumber(
    chemicalProductId: string,
    lotNumber: string,
  ): Promise<Lot | null> {
    const record = await this.prisma.lot.findUnique({
      where: { chemicalProductId_lotNumber: { chemicalProductId, lotNumber } },
    });

    return record ? PrismaLotRepository.toDomain(record) : null;
  }

  async listByProduct(chemicalProductId: string, filters: LotSearchFilters): Promise<LotPage> {
    const where = {
      chemicalProductId,
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.lot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.lot.count({ where }),
    ]);

    return {
      items: records.map((record) => PrismaLotRepository.toDomain(record)),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async countOpenByProduct(chemicalProductId: string): Promise<number> {
    return this.prisma.lot.count({
      where: {
        chemicalProductId,
        status: { notIn: [LotStatus.RELEASED, LotStatus.DISPOSED] },
      },
    });
  }

  private static toPersistence(lot: Lot) {
    return {
      lotNumber: lot.lotNumber,
      quantity: lot.quantity,
      status: lot.status,
      reservedForOperationId: lot.reservedForOperationId,
    };
  }

  /** A quantidade é DECIMAL no banco e chega como Prisma.Decimal; o domínio usa number. */
  private static toDomain(record: LotModel): Lot {
    return Lot.restore({
      id: record.id,
      chemicalProductId: record.chemicalProductId,
      lotNumber: record.lotNumber,
      quantity: Number(record.quantity),
      status: record.status as LotStatus,
      reservedForOperationId: record.reservedForOperationId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
