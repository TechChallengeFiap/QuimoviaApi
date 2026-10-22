import { AuditLogEntry } from '@/modules/audit-log/domain/entities/audit-log-entry.entity.js';
import { AuditAction } from '@/modules/audit-log/domain/enums/audit-action.enum.js';
import { AuditedEntity } from '@/modules/audit-log/domain/enums/audited-entity.enum.js';
import { RecordAuditLogUseCase } from '@/modules/audit-log/application/use-cases/record-audit-log.use-case.js';
import { ListAuditLogsUseCase } from '@/modules/audit-log/application/use-cases/list-audit-logs.use-case.js';
import { AuditLogsController } from '@/modules/audit-log/presentation/controllers/audit-logs.controller.js';
import { AuditLogRepositoryMock } from '../../mocks/audit-log-repository.mock.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

describe('AuditLog Module (unit)', () => {
  let repository: AuditLogRepositoryMock;
  let recordUseCase: RecordAuditLogUseCase;
  let listUseCase: ListAuditLogsUseCase;
  let controller: AuditLogsController;

  beforeEach(() => {
    repository = new AuditLogRepositoryMock();
    recordUseCase = new RecordAuditLogUseCase(repository);
    listUseCase = new ListAuditLogsUseCase(repository);
    controller = new AuditLogsController(listUseCase);
  });

  describe('AuditLogEntry', () => {
    it('cria uma entrada de log válida', () => {
      const entry = AuditLogEntry.create({
        entityType: AuditedEntity.CHEMICAL_SHIPMENT,
        entityId: 'shipment-1',
        actorId: 'user-1',
        actorName: 'Operador Silva',
        action: AuditAction.CREATED,
        description: 'Usuário Operador Silva registrou a carga shipment-1',
        details: { quantityProduct: 50 },
      });

      expect(entry.id).toBeDefined();
      expect(entry.entityType).toBe(AuditedEntity.CHEMICAL_SHIPMENT);
      expect(entry.entityId).toBe('shipment-1');
      expect(entry.actorName).toBe('Operador Silva');
      expect(entry.description).toBe('Usuário Operador Silva registrou a carga shipment-1');
      expect(entry.details).toEqual({ quantityProduct: 50 });
      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('valida invariantes obrigatórias', () => {
      expect(() =>
        AuditLogEntry.create({
          entityType: AuditedEntity.USER,
          entityId: '',
          actorId: 'user-1',
          actorName: 'Admin',
          action: AuditAction.CREATED,
          description: 'Criação',
        }),
      ).toThrow(BusinessRuleError);
    });
  });

  describe('RecordAuditLogUseCase & ListAuditLogsUseCase', () => {
    it('registra e lista logs filtrados por tipo de entidade', async () => {
      await recordUseCase.record({
        entityType: AuditedEntity.USER,
        entityId: 'u-1',
        actorId: 'admin-1',
        actorName: 'Administrador',
        action: AuditAction.CREATED,
        description: 'Administrador criou o usuário u-1',
      });

      await recordUseCase.record({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        entityId: 'p-1',
        actorId: 'admin-1',
        actorName: 'Administrador',
        action: AuditAction.CREATED,
        description: 'Administrador cadastrou o produto p-1',
      });

      const userLogs = await listUseCase.execute({
        entityType: AuditedEntity.USER,
        page: 1,
        pageSize: 10,
      });

      expect(userLogs.total).toBe(1);
      expect(userLogs.items[0].entityId).toBe('u-1');

      const productLogs = await listUseCase.execute({
        entityType: AuditedEntity.CHEMICAL_PRODUCT,
        page: 1,
        pageSize: 10,
      });

      expect(productLogs.total).toBe(1);
      expect(productLogs.items[0].entityId).toBe('p-1');
    });
  });

  describe('AuditLogsController', () => {
    it('retorna os logs de usuários pelo endpoint correspondente', async () => {
      await recordUseCase.record({
        entityType: AuditedEntity.USER,
        entityId: 'u-1',
        actorId: 'admin-1',
        actorName: 'Administrador',
        action: AuditAction.LOGGED_IN,
        description: 'Usuário u-1 realizou login',
      });

      const response = await controller.listUserLogs({});
      expect(response.total).toBe(1);
      expect(response.items[0].action).toBe(AuditAction.LOGGED_IN);
    });
  });
});
