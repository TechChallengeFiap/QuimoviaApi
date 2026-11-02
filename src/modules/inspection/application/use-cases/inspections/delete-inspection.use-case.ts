import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/user/domain/repositories/user.repository.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { InspectionActionActor } from './create-inspection.use-case.js';

@Injectable()
export class DeleteInspectionUseCase {
  private readonly logger = new Logger(DeleteInspectionUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspections: InspectionRepository,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly users?: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  async execute(id: string, actor?: InspectionActionActor | null): Promise<void> {
    try {
      const inspection = await this.inspections.findById(id);

      if (!inspection) {
        throw new ResourceNotFoundError('Inspeção', id);
      }

      if (!inspection.canBeRemoved()) {
        throw new BusinessRuleError(
          'Somente inspeções pendentes podem ser removidas; as demais fazem parte do histórico da carga.',
        );
      }

      await this.inspections.remove(id);

      if (this.auditLogs) {
        let actorName = actor?.name;
        if (!actorName && actor?.id && this.users) {
          const user = await this.users.findById(actor.id);
          actorName = user?.name;
        }
        const actorId = actor?.id ?? inspection.inspectorId;
        const resolvedActorName = actorName ?? 'Fiscal';

        await this.auditLogs.record({
          entityType: AuditedEntity.INSPECTION,
          entityId: inspection.id,
          actorId,
          actorName: resolvedActorName,
          action: AuditAction.DELETED,
          description: `Usuário "${resolvedActorName}" removeu a inspeção "${inspection.id}" da carga "${inspection.cargoId}"`,
          details: {
            cargoId: inspection.cargoId,
            inspectorId: inspection.inspectorId,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Erro ao remover a inspeção com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
