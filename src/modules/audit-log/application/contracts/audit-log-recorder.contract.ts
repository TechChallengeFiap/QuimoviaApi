import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';

export interface RecordAuditLogInput {
  entityType: AuditedEntity;
  entityId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  description: string;
  details?: Record<string, unknown> | null;
}

export interface AuditLogRecorder {
  record(input: RecordAuditLogInput): Promise<void>;
}

export const AUDIT_LOG_RECORDER = Symbol('AuditLogRecorder');
