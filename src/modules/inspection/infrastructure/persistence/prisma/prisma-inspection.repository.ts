import { Inject, Injectable } from '@nestjs/common';
import {
  InspectionPage,
  InspectionRepository,
  InspectionSearchFilters,
} from '@/modules/inspection/domain/repositories/inspection.repository.js';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { InspectionItem } from '@/modules/inspection/domain/value-objects/inspection-item.vo.js';
import type {
  InspectionItemModel as PersistedInspectionItem,
  InspectionModel as PersistedInspection,
} from '@/generated/prisma/models.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

type PersistedInspectionWithItems = PersistedInspection & {
  items: PersistedInspectionItem[];
};

/** Os itens voltam sempre na mesma ordem, a de declaração dos requisitos. */
const INCLUDE_ITEMS = {
  items: { orderBy: { requirement: 'asc' } },
} as const;

@Injectable()
export class PrismaInspectionRepository implements InspectionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(inspection: Inspection): Promise<Inspection> {
    const record = await this.prisma.inspection.create({
      data: {
        id: inspection.id,
        cargoId: inspection.cargoId,
        compositionVersion: inspection.compositionVersion,
        scope: inspection.scope,
        cargoItemId: inspection.cargoItemId,
        inspectorId: inspection.inspectorId,
        status: inspection.status,
        startedAt: inspection.startedAt,
        completedAt: inspection.completedAt,
        items: {
          create: inspection.items.map((item) => ({
            requirement: item.requirement,
            result: item.result,
            observation: item.observation,
          })),
        },
      },
      include: INCLUDE_ITEMS,
    });

    return PrismaInspectionRepository.toDomain(record);
  }

  /**
   * As verificações previstas não mudam depois do cadastro; apenas seus
   * resultados são atualizados, identificados pelo par inspeção e requisito.
   */
  async update(inspection: Inspection): Promise<Inspection> {
    const record = await this.prisma.inspection.update({
      where: { id: inspection.id },
      data: {
        inspectorId: inspection.inspectorId,
        status: inspection.status,
        startedAt: inspection.startedAt,
        completedAt: inspection.completedAt,
        items: {
          update: inspection.items.map((item) => ({
            where: {
              inspectionId_requirement: {
                inspectionId: inspection.id,
                requirement: item.requirement,
              },
            },
            data: { result: item.result, observation: item.observation },
          })),
        },
      },
      include: INCLUDE_ITEMS,
    });

    return PrismaInspectionRepository.toDomain(record);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.inspection.delete({ where: { id } });
  }

  async findById(id: string): Promise<Inspection | null> {
    const record = await this.prisma.inspection.findUnique({
      where: { id },
      include: INCLUDE_ITEMS,
    });

    return record ? PrismaInspectionRepository.toDomain(record) : null;
  }

  async list(filters: InspectionSearchFilters): Promise<InspectionPage> {
    const where = {
      ...(filters.cargoId ? { cargoId: filters.cargoId } : {}),
      ...(filters.inspectorId ? { inspectorId: filters.inspectorId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        include: INCLUDE_ITEMS,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.inspection.count({ where }),
    ]);

    return {
      items: records.map((record) =>
        PrismaInspectionRepository.toDomain(record),
      ),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private static toDomain(record: PersistedInspectionWithItems): Inspection {
    return Inspection.restore({
      id: record.id,
      cargoId: record.cargoId,
      compositionVersion: record.compositionVersion,
      scope: record.scope as InspectionScope,
      cargoItemId: record.cargoItemId,
      inspectorId: record.inspectorId,
      status: record.status as InspectionStatus,
      items: record.items.map((item) =>
        InspectionItem.restore({
          requirement: item.requirement as InspectionRequirement,
          result: item.result as InspectionItemResult | null,
          observation: item.observation,
        }),
      ),
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
