import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/persistence/prisma/prisma.service.ts';
import type { ChemicalShipmentModel } from '../../generated/prisma/models.ts';
import {
  ChemicalShipmentVO,
  CreateChemicalShipmentVO,
} from '../../domain/entities/chemical-shipment/chemical-shipment.entity.ts';

@Injectable()
export class ChemicalShipmentRepository {
  constructor(private prismaService: PrismaService) {}

  async create(
    chemicalShipment: CreateChemicalShipmentVO,
  ): Promise<ChemicalShipmentVO> {
    const createdChemicalShipment =
      await this.prismaService.chemicalShipment.create({
        data: {
          productId: chemicalShipment.productId,
          responsibleUserId: chemicalShipment.responsibleUserId,
          documentsIds: chemicalShipment.documentsIds,
        },
      });

    return this.mapToEntity(createdChemicalShipment);
  }

  update(chemicalShipment: ChemicalShipmentVO): Promise<ChemicalShipmentVO> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<ChemicalShipmentVO | null> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<ChemicalShipmentVO[]> {
    throw new Error('Method not implemented.');
  }

  private mapToEntity(
    chemicalShipment: ChemicalShipmentModel,
  ): ChemicalShipmentVO {
    return {
      id: chemicalShipment.id,
      createdAt: chemicalShipment.createdAt,
      updatedAt: chemicalShipment.updatedAt,
      status: chemicalShipment.status,
      productId: chemicalShipment.productId,
      responsibleUserId: chemicalShipment.responsibleUserId,
      documentsIds: chemicalShipment.documentsIds,
      deletedAt: chemicalShipment.deletedAt ?? null,
    };
  }
}
