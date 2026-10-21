import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';

export class AuditLogResponseDto {
  @ApiProperty({
    type: String,
    description: 'Identificador único do registro de log',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: string;

  @ApiProperty({
    enum: AuditedEntity,
    enumName: 'AuditedEntity',
    type: String,
    description: 'Tipo da entidade auditada',
    example: AuditedEntity.CHEMICAL_SHIPMENT,
  })
  entityType: AuditedEntity;

  @ApiProperty({
    type: String,
    description: 'Identificador da entidade auditada',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  entityId: string;

  @ApiProperty({
    type: String,
    description: 'Identificador do usuário que realizou a ação',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  actorId: string;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário no momento da ação',
    example: 'Maria Silva',
  })
  actorName: string;

  @ApiProperty({
    enum: AuditAction,
    enumName: 'AuditAction',
    type: String,
    description: 'Ação executada',
    example: AuditAction.CREATED,
  })
  action: AuditAction;

  @ApiProperty({
    type: String,
    description: 'Descrição legível do evento ocorrido',
    example: 'Usuário Maria Silva registrou a carga 3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  description: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    description: 'Detalhes adicionais ou snapshot dos dados no momento da ação',
    example: { status: 'ANALYZING', quantityProduct: 100 },
  })
  details?: Record<string, unknown> | null;

  @ApiProperty({
    type: Date,
    description: 'Data e hora em que a ação ocorreu',
    example: '2026-10-20T21:00:00.000Z',
  })
  createdAt: Date;

  private constructor(data: AuditLogResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(entry: AuditLogEntry): AuditLogResponseDto {
    return new AuditLogResponseDto({
      id: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action,
      description: entry.description,
      details: entry.details,
      createdAt: entry.createdAt,
    });
  }
}
