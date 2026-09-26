import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.ts';
import type { ChemicalShipmentModel as PersistedChemicalShipment } from '@/generated/prisma/models.ts';
import {
  ChemicalShipment,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import type { ChemicalShipmentPage, ChemicalShipmentRepository, ChemicalShipmentSearchFilters } from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';

@Injectable()
export class PrismaChemicalShipmentRepository
  implements ChemicalShipmentRepository
{
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  async create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    const createdChemicalShipment =
      await this.prismaService.chemicalShipment.create({
        data: {
          id: chemicalShipment.id,
          createdAt: chemicalShipment.createdAt,
          updatedAt: chemicalShipment.updatedAt,
          status: chemicalShipment.status,
          productId: chemicalShipment.productId,
          responsibleUserId: chemicalShipment.responsibleUserId,
          documentsIds: chemicalShipment.documentsIds,
        },
      });

    return PrismaChemicalShipmentRepository.toDomain(createdChemicalShipment);
  }

  async list(filters: ChemicalShipmentSearchFilters): Promise<ChemicalShipmentPage> {
    const page = Number(filters.page);
    const pageSize = Number(filters.pageSize);

    const where = {
      status: filters.status,
      productId: filters.productId,
      responsibleUserId: filters.responsibleUserId,
      documentsIds: filters.documentsIds,
    };

    const [items, total] = await Promise.all([
      this.prismaService.chemicalShipment.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prismaService.chemicalShipment.count({
        where,
      }),
    ]);

    return {
      items: items.map((item) => PrismaChemicalShipmentRepository.toDomain(item)),
      total,
      page,
      pageSize,
    };
  }

  update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<ChemicalShipment | null> {
    throw new Error('Method not implemented.');
  }


  private static toDomain(
    chemicalShipment: PersistedChemicalShipment,
  ): ChemicalShipment {
    return ChemicalShipment.restore({
        id: chemicalShipment.id,
        createdAt: chemicalShipment.createdAt,
        updatedAt: chemicalShipment.updatedAt,
        status: chemicalShipment.status,
        productId: chemicalShipment.productId,
        responsibleUserId: chemicalShipment.responsibleUserId,
        documentsIds: chemicalShipment.documentsIds,
        deletedAt: chemicalShipment.deletedAt ?? null,
    })
  }
}
