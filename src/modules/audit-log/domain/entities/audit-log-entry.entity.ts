import { randomUUID } from 'node:crypto';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

export interface AuditLogProperties {
  id: string;
  entityType: AuditedEntity;
  entityId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  description: string;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateAuditLogData {
  entityType: AuditedEntity;
  entityId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  description: string;
  details?: Record<string, unknown> | null;
}

export class AuditLogEntry {
  readonly id: string;
  readonly entityType: AuditedEntity;
  readonly entityId: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly action: AuditAction;
  readonly description: string;
  readonly details: Record<string, unknown> | null;
  readonly createdAt: Date;

  private constructor(props: AuditLogProperties) {
    this.id = props.id;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.actorId = props.actorId;
    this.actorName = props.actorName;
    this.action = props.action;
    this.description = props.description;
    this.details = props.details;
    this.createdAt = props.createdAt;
  }

  static create(data: CreateAuditLogData): AuditLogEntry {
    if (!data.entityId || data.entityId.trim().length === 0) {
      throw new BusinessRuleError('O identificador da entidade auditada é obrigatório.');
    }
    if (!data.actorId || data.actorId.trim().length === 0) {
      throw new BusinessRuleError('O identificador do autor da ação é obrigatório.');
    }
    if (!data.actorName || data.actorName.trim().length === 0) {
      throw new BusinessRuleError('O nome do autor da ação é obrigatório.');
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new BusinessRuleError('A descrição do registro de log é obrigatória.');
    }

    return new AuditLogEntry({
      id: randomUUID(),
      entityType: data.entityType,
      entityId: data.entityId.trim(),
      actorId: data.actorId.trim(),
      actorName: data.actorName.trim(),
      action: data.action,
      description: data.description.trim(),
      details: data.details ?? null,
      createdAt: new Date(),
    });
  }

  static restore(props: AuditLogProperties): AuditLogEntry {
    return new AuditLogEntry(props);
  }
}
