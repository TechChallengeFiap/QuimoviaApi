import type {
  AuditLogRecorder,
  RecordAuditLogInput,
} from '@/modules/audit-log/public/index.js';

export class AuditLogRecorderMock implements AuditLogRecorder {
  readonly logs: RecordAuditLogInput[] = [];

  async record(input: RecordAuditLogInput): Promise<void> {
    this.logs.push(input);
  }

  findLastByEntity(entityId: string): RecordAuditLogInput | undefined {
    return [...this.logs].reverse().find((l) => l.entityId === entityId);
  }

  clear(): void {
    this.logs.length = 0;
  }
}
