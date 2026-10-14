import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipmentModel as PersistedChemicalShipment } from '@/generated/prisma/models.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import type {
  ChemicalShipmentPage,
  ChemicalShipmentRepository,
  ChemicalShipmentSearchFilters,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

/**
 * Persistência das cargas químicas.
 *
 * Lê e grava apenas a tabela de cargas. O responsável é referenciado pelo
 * identificador: os dados do usuário pertencem a Identidade e Acesso e são
 * obtidos pelo contrato público daquele contexto, nunca por relação do Prisma.
 */
@Injectable()
export class PrismaChemicalShipmentRepository implements ChemicalShipmentRepository {
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

  async list(
    filters: ChemicalShipmentSearchFilters,
  ): Promise<ChemicalShipmentPage> {
    const page = Number(filters.page);
    const pageSize = Number(filters.pageSize);

    const where = {
      status: filters.status,
      productId: filters.productId,
      responsibleUserId: filters.responsibleUserId,
      documentsIds: filters.documentsIds,
      deletedAt: null,
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
      items: items.map((item) =>
        PrismaChemicalShipmentRepository.toDomain(item),
      ),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<ChemicalShipment | null> {
    const record = await this.prismaService.chemicalShipment.findUnique({
      where: { id },
    });

    return record ? PrismaChemicalShipmentRepository.toDomain(record) : null;
  }

  async update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    const updatedChemicalShipment =
      await this.prismaService.chemicalShipment.update({
        where: { id: chemicalShipment.id },
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

    return PrismaChemicalShipmentRepository.toDomain(updatedChemicalShipment);
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.chemicalShipment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private static toDomain(record: PersistedChemicalShipment): ChemicalShipment {
    return ChemicalShipment.restore({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: record.status,
      productId: record.productId,
      responsibleUserId: record.responsibleUserId,
      documentsIds: record.documentsIds,
      deletedAt: record.deletedAt ?? null,
    });
  }
}
