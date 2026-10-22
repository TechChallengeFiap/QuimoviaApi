import type {
  AuditLogPage,
  AuditLogRepository,
  AuditLogSearchFilters,
} from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import type { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';

export class AuditLogRepositoryMock implements AuditLogRepository {
  readonly entries: AuditLogEntry[] = [];

  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    this.entries.push(entry);
    return entry;
  }

  async list(filters: AuditLogSearchFilters): Promise<AuditLogPage> {
    const filtered = this.entries.filter((e) => {
      if (e.entityType !== filters.entityType) return false;
      if (filters.entityId && e.entityId !== filters.entityId) return false;
      if (filters.actorId && e.actorId !== filters.actorId) return false;
      return true;
    });

    const start = (filters.page - 1) * filters.pageSize;
    const items = filtered.slice(start, start + filters.pageSize);

    return {
      items,
      total: filtered.length,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }
}
