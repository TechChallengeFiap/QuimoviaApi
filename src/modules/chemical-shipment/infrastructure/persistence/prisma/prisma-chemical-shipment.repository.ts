import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(PrismaChemicalShipmentRepository.name);

  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  async create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    try {
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
    } catch (error) {
      this.logger.error(
        `Erro ao persistir carga química no banco de dados: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async list(
    filters: ChemicalShipmentSearchFilters,
  ): Promise<ChemicalShipmentPage> {
    try {
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
    } catch (error) {
      this.logger.error(
        `Erro ao consultar lista de cargas químicas no banco de dados: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ChemicalShipment | null> {
    try {
      const record = await this.prismaService.chemicalShipment.findUnique({
        where: { id },
      });

      return record ? PrismaChemicalShipmentRepository.toDomain(record) : null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar carga química por ID ${id} no banco de dados: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    try {
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
    } catch (error) {
      this.logger.error(
        `Erro ao persistir carga química no banco de dados: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prismaService.chemicalShipment.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao remover carga química no banco de dados: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
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
