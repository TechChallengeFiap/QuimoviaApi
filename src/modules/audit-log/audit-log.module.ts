import { forwardRef, Global, Module } from '@nestjs/common';
import { AuthModule } from '@/modules/user/auth.module.js';
import { AUDIT_LOG_REPOSITORY } from '@/modules/audit-log/domain/repositories/audit-log.repository.js';
import { PrismaAuditLogRepository } from '@/modules/audit-log/infrastructure/persistence/prisma/prisma-audit-log.repository.js';
import { AUDIT_LOG_RECORDER } from '@/modules/audit-log/application/contracts/audit-log-recorder.contract.js';
import { RecordAuditLogUseCase } from '@/modules/audit-log/application/use-cases/record-audit-log.use-case.js';
import { ListAuditLogsUseCase } from '@/modules/audit-log/application/use-cases/list-audit-logs.use-case.js';
import { AuditLogsController } from '@/modules/audit-log/presentation/controllers/audit-logs.controller.js';

@Global()
@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AuditLogsController],
  providers: [
    ListAuditLogsUseCase,
    RecordAuditLogUseCase,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
    {
      provide: AUDIT_LOG_RECORDER,
      useClass: RecordAuditLogUseCase,
    },
  ],
  exports: [AUDIT_LOG_RECORDER, AUDIT_LOG_REPOSITORY],
})
export class AuditLogModule {}
