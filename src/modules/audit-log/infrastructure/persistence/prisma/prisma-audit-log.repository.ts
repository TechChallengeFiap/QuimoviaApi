import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';
import { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type {
  AuditLogPage,
  AuditLogRepository,
  AuditLogSearchFilters,
} from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import type { InputJsonValue } from '@/generated/prisma/internal/prismaNamespace.js';

interface RawLogRecord {
  id: string;
  entityId: string;
  actorId: string;
  actorName: string;
  action: string;
  description: string;
  details: unknown;
  createdAt: Date;
}

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const data = {
      id: entry.id,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action as unknown as 'CREATED',
      description: entry.description,
      details: (entry.details ?? undefined) as InputJsonValue | undefined,
      createdAt: entry.createdAt,
    };

    switch (entry.entityType) {
      case AuditedEntity.USER:
        await this.prisma.userLog.create({ data });
        break;
      case AuditedEntity.CHEMICAL_PRODUCT:
        await this.prisma.chemicalProductLog.create({ data });
        break;
      case AuditedEntity.CHEMICAL_SHIPMENT:
        await this.prisma.chemicalShipmentLog.create({ data });
        break;
      case AuditedEntity.INSPECTION:
        await this.prisma.inspectionLog.create({ data });
        break;
      case AuditedEntity.SHIPMENT_DOCUMENT:
        await this.prisma.shipmentDocumentLog.create({ data });
        break;
    }

    return entry;
  }

  async list(filters: AuditLogSearchFilters): Promise<AuditLogPage> {
    const where = {
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;
    const orderBy = { createdAt: 'desc' as const };

    let records: RawLogRecord[] = [];
    let total = 0;

    switch (filters.entityType) {
      case AuditedEntity.USER: {
        const [items, count] = await Promise.all([
          this.prisma.userLog.findMany({ where, skip, take, orderBy }),
          this.prisma.userLog.count({ where }),
        ]);
        records = items;
        total = count;
        break;
      }
      case AuditedEntity.CHEMICAL_PRODUCT: {
        const [items, count] = await Promise.all([
          this.prisma.chemicalProductLog.findMany({ where, skip, take, orderBy }),
          this.prisma.chemicalProductLog.count({ where }),
        ]);
        records = items;
        total = count;
        break;
      }
      case AuditedEntity.CHEMICAL_SHIPMENT: {
        const [items, count] = await Promise.all([
          this.prisma.chemicalShipmentLog.findMany({ where, skip, take, orderBy }),
          this.prisma.chemicalShipmentLog.count({ where }),
        ]);
        records = items;
        total = count;
        break;
      }
      case AuditedEntity.INSPECTION: {
        const [items, count] = await Promise.all([
          this.prisma.inspectionLog.findMany({ where, skip, take, orderBy }),
          this.prisma.inspectionLog.count({ where }),
        ]);
        records = items;
        total = count;
        break;
      }
      case AuditedEntity.SHIPMENT_DOCUMENT: {
        const [items, count] = await Promise.all([
          this.prisma.shipmentDocumentLog.findMany({ where, skip, take, orderBy }),
          this.prisma.shipmentDocumentLog.count({ where }),
        ]);
        records = items;
        total = count;
        break;
      }
    }

    return {
      items: records.map((record) =>
        AuditLogEntry.restore({
          id: record.id,
          entityType: filters.entityType,
          entityId: record.entityId,
          actorId: record.actorId,
          actorName: record.actorName,
          action: record.action as AuditAction,
          description: record.description,
          details: (record.details as Record<string, unknown>) ?? null,
          createdAt: record.createdAt,
        }),
      ),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }
}
