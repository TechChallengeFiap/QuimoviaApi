import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import type {
  AuditLogRecorder,
  RecordAuditLogInput,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';

@Injectable()
export class RecordAuditLogUseCase implements AuditLogRecorder {
  private readonly logger = new Logger(RecordAuditLogUseCase.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async record(input: RecordAuditLogInput): Promise<void> {
    try {
      const entry = AuditLogEntry.create(input);
      await this.auditLogs.create(entry);
    } catch (error) {
      this.logger.error(
        `Erro ao registrar log de auditoria para ${input.entityType} [${input.entityId}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      // Não lançamos erro aqui para não quebrar a transação de negócio se o log falhar,
      // mas registramos no log do Nest.
    }
  }
}
