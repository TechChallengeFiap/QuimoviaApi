import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionItemResult } from '@/modules/inspection/domain/enums/inspection-item-result.enum.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
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
import type { User } from '@/modules/user/domain/entities/user.entity.js';
import { UserStatus } from '@/modules/user/domain/enums/user-status.enum.js';
import {
  AUDIT_LOG_RECORDER,
  type AuditLogRecorder,
} from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import type { InspectionActionActor } from './create-inspection.use-case.js';

export interface InspectionResultInput {
  requirement: InspectionRequirement;
  result: InspectionItemResult;
  observation?: string;
}

export interface UpdateInspectionInput {
  inspectorId?: string;
  status?: InspectionStatus;
  results?: InspectionResultInput[];
}

@Injectable()
export class UpdateInspectionUseCase {
  private readonly logger = new Logger(UpdateInspectionUseCase.name);

  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionsRepository: InspectionRepository,
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
    @Optional()
    @Inject(AUDIT_LOG_RECORDER)
    private readonly auditLogs?: AuditLogRecorder,
  ) {}

  /**
   * Os resultados são aplicados depois do início e antes da conclusão, para
   * que uma única requisição possa iniciar a inspeção e registrar resultados,
   * ou registrar os últimos resultados e concluí-la.
   */
  async execute(
    id: string,
    input: UpdateInspectionInput,
    actor?: InspectionActionActor | null,
  ): Promise<Inspection> {
    try {
      const { newInspector } = await this.validateInput(input);
      const inspection = await this.inspectionsRepository.findById(id);

      if (!inspection) {
        throw new ResourceNotFoundError('Inspeção', id);
      }

      if (input.inspectorId !== undefined) {
        inspection.assignInspector(input.inspectorId, newInspector);
      }

      if (input.status === InspectionStatus.IN_PROGRESS) {
        this.changeStatus(inspection, input.status);
      }

      for (const result of input.results ?? []) {
        inspection.recordResult(
          result.requirement,
          result.result,
          result.observation,
        );
      }

      if (
        input.status !== undefined &&
        input.status !== InspectionStatus.IN_PROGRESS
      ) {
        this.changeStatus(inspection, input.status);
      }

      const updated = await this.inspectionsRepository.update(inspection);

      if (this.auditLogs) {
        let actorName = actor?.name;
        if (!actorName && actor?.id) {
          const user = await this.usersRepository.findById(actor.id);
          actorName = user?.name;
        }
        const actorId = actor?.id ?? updated.inspectorId;
        const resolvedActorName = actorName ?? 'Fiscal';

        const action = input.status ? AuditAction.STATUS_CHANGED : AuditAction.UPDATED;
        const description = input.status
          ? `Usuário "${resolvedActorName}" alterou o status da inspeção "${updated.id}" para "${input.status}"`
          : `Usuário "${resolvedActorName}" atualizou a inspeção "${updated.id}"`;

        await this.auditLogs.record({
          entityType: AuditedEntity.INSPECTION,
          entityId: updated.id,
          actorId,
          actorName: resolvedActorName,
          action,
          description,
          details: {
            cargoId: updated.cargoId,
            status: updated.status,
            inspectorId: updated.inspectorId,
          },
        });
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar a inspeção com id ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async validateInput(
    input: UpdateInspectionInput,
  ): Promise<{ newInspector?: User }> {
    if (input.inspectorId) {
      const inspectorExists = await this.usersRepository.findById(
        input.inspectorId,
      );
      if (!inspectorExists) {
        throw new ResourceNotFoundError('Usuário', input.inspectorId);
      }
      if (inspectorExists.status !== UserStatus.ACTIVE) {
        throw new BusinessRuleError(
          'O novo fiscal responsável pela inspeção deve estar ativo no sistema.',
        );
      }
      return { newInspector: inspectorExists };
    }
    return {};
  }

  /**
   * As transições passam pelos métodos da entidade, que garantem a ordem
   * PENDING -> IN_PROGRESS -> COMPLETED e as condições de cada etapa.
   */
  private changeStatus(inspection: Inspection, status: InspectionStatus): void {
    if (inspection.status === status) {
      return;
    }

    switch (status) {
      case InspectionStatus.IN_PROGRESS:
        inspection.start();
        break;
      case InspectionStatus.COMPLETED:
        inspection.complete();
        break;
      case InspectionStatus.PENDING:
        throw new BusinessRuleError(
          'Uma inspeção iniciada não pode voltar a ficar pendente.',
        );
    }
  }
}
