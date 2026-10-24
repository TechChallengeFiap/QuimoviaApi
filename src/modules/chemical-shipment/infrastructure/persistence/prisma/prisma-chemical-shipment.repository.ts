import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import type {
  ChemicalShipmentModel as PersistedChemicalShipment,
  UserModel as PersistedUser,
} from '@/generated/prisma/models.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import type {
  ChemicalShipmentPage,
  ChemicalShipmentRepository,
  ChemicalShipmentSearchFilters,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';

type PersistedChemicalShipmentWithRelations = PersistedChemicalShipment & {
  responsibleUser?: PersistedUser | null;
};

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
            status: chemicalShipment.status as any,
            productId: chemicalShipment.productId,
            quantityProduct: chemicalShipment.quantityProduct,
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
        status: filters.status as any,
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
          include: {
            responsibleUser: true,
          },
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
        include: {
          responsibleUser: true,
        },
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
            status: chemicalShipment.status as any,
            productId: chemicalShipment.productId,
            quantityProduct: chemicalShipment.quantityProduct,
            responsibleUserId: chemicalShipment.responsibleUserId,
            documentsIds: chemicalShipment.documentsIds,
          },
          include: {
            responsibleUser: true,
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

  private static toDomain(
    chemicalShipment: PersistedChemicalShipmentWithRelations,
  ): ChemicalShipment {
    return ChemicalShipment.restore({
      id: chemicalShipment.id,
      createdAt: chemicalShipment.createdAt,
      updatedAt: chemicalShipment.updatedAt,
      status: chemicalShipment.status as unknown as StatusShipment,
      productId: chemicalShipment.productId,
      quantityProduct: chemicalShipment.quantityProduct,
      responsibleUserId: chemicalShipment.responsibleUserId,
      responsibleUser: chemicalShipment.responsibleUser
        ? User.restore({
            id: chemicalShipment.responsibleUser.id,
            name: chemicalShipment.responsibleUser.name,
            email: chemicalShipment.responsibleUser.email,
            passwordHash: chemicalShipment.responsibleUser.passwordHash,
            role: chemicalShipment.responsibleUser.role as UserRole,
            status: chemicalShipment.responsibleUser.status as UserStatus,
            lastLoginAt: chemicalShipment.responsibleUser.lastLoginAt,
            createdAt: chemicalShipment.responsibleUser.createdAt,
            updatedAt: chemicalShipment.responsibleUser.updatedAt,
          })
        : null,
      documentsIds: chemicalShipment.documentsIds,
      deletedAt: chemicalShipment.deletedAt ?? null,
    });
  }
}
