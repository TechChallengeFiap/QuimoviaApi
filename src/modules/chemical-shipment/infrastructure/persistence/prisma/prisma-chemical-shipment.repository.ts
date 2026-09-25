import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.ts';
import type { ChemicalShipmentModel as PersistedChemicalShipment } from '@/generated/prisma/models.ts';
import {
  ChemicalShipment,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import type { ChemicalShipmentRepository } from '@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts';

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

  update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<ChemicalShipment | null> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<ChemicalShipment[]> {
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
