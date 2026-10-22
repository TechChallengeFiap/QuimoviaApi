import { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';

export interface AuditLogSearchFilters {
  entityType: AuditedEntity;
  entityId?: string;
  actorId?: string;
  page: number;
  pageSize: number;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditLogRepository {
  create(entry: AuditLogEntry): Promise<AuditLogEntry>;
  list(filters: AuditLogSearchFilters): Promise<AuditLogPage>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AuditLogRepository');
