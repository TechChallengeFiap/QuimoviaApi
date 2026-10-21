import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogPage,
  type AuditLogRepository,
  type AuditLogSearchFilters,
} from '@/modules/audit-log/domain/repositories/audit-log.repository.js';

export const DEFAULT_LOGS_PAGE = 1;
export const DEFAULT_LOGS_PAGE_SIZE = 20;

@Injectable()
export class ListAuditLogsUseCase {
  private readonly logger = new Logger(ListAuditLogsUseCase.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(filters: AuditLogSearchFilters): Promise<AuditLogPage> {
    try {
      return await this.auditLogs.list({
        entityType: filters.entityType,
        entityId: filters.entityId,
        actorId: filters.actorId,
        page: filters.page ?? DEFAULT_LOGS_PAGE,
        pageSize: filters.pageSize ?? DEFAULT_LOGS_PAGE_SIZE,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao listar logs de auditoria para ${filters.entityType}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
