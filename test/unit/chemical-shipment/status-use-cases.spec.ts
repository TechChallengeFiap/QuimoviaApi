import { beforeEach, describe, expect, it } from '@jest/globals';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import {
  StartShipmentAnalysisUseCase,
  SendShipmentToInspectionUseCase,
  ReleaseChemicalShipmentUseCase,
  BlockChemicalShipmentUseCase,
  StartShipmentTransitUseCase,
  CompleteChemicalShipmentUseCase,
  CancelChemicalShipmentUseCase,
  ChangeChemicalShipmentStatusUseCase,
} from '@/modules/chemical-shipment/application/use-cases/chemical-shipment/status/index.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { AuditAction, AuditedEntity } from '@/modules/audit-log/public/index.js';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import { UserRepositoryMock } from '../../mocks/user-repository.mock.js';
import { AuditLogRecorderMock } from '../../mocks/audit-log-recorder.mock.js';
import { ShipmentDocumentationCheckerMock } from '../../mocks/shipment-documentation-checker.mock.js';

describe('Chemical Shipment Status Use Cases', () => {
  let shipmentsRepo: ChemicalShipmentMock;
  let usersRepo: UserRepositoryMock;
  let auditLogs: AuditLogRecorderMock;
  let docChecker: ShipmentDocumentationCheckerMock;

  let startAnalysisUseCase: StartShipmentAnalysisUseCase;
  let sendToInspectionUseCase: SendShipmentToInspectionUseCase;
  let releaseUseCase: ReleaseChemicalShipmentUseCase;
  let blockUseCase: BlockChemicalShipmentUseCase;
  let startTransitUseCase: StartShipmentTransitUseCase;
  let completeUseCase: CompleteChemicalShipmentUseCase;
  let cancelUseCase: CancelChemicalShipmentUseCase;
  let changeStatusUseCase: ChangeChemicalShipmentStatusUseCase;

  beforeEach(() => {
    shipmentsRepo = new ChemicalShipmentMock();
    usersRepo = new UserRepositoryMock();
    auditLogs = new AuditLogRecorderMock();
    docChecker = new ShipmentDocumentationCheckerMock();

    startAnalysisUseCase = new StartShipmentAnalysisUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );
    sendToInspectionUseCase = new SendShipmentToInspectionUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );
    releaseUseCase = new ReleaseChemicalShipmentUseCase(
      shipmentsRepo,
      docChecker,
      usersRepo,
      auditLogs,
    );
    blockUseCase = new BlockChemicalShipmentUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );
    startTransitUseCase = new StartShipmentTransitUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );
    completeUseCase = new CompleteChemicalShipmentUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );
    cancelUseCase = new CancelChemicalShipmentUseCase(
      shipmentsRepo,
      usersRepo,
      auditLogs,
    );

    changeStatusUseCase = new ChangeChemicalShipmentStatusUseCase(
      startAnalysisUseCase,
      sendToInspectionUseCase,
      releaseUseCase,
      blockUseCase,
      startTransitUseCase,
      completeUseCase,
      cancelUseCase,
    );
  });

  async function createRegisteredShipment() {
    return shipmentsRepo.create(
      ChemicalShipment.create({
        productId: 'prod-001',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
        quantityProduct: 500,
      }),
    );
  }

  describe('Fluxo principal e use cases especialistas', () => {
    it('executa o ciclo completo de vida da carga química', async () => {
      const shipment = await createRegisteredShipment();
      const actor = { id: 'user-001', name: 'Operador Santos' };
      docChecker.markAsDocumented(shipment.id);

      // 1. Registrada -> Em análise
      const analyzing = await startAnalysisUseCase.execute(shipment.id, actor);
      expect(analyzing.status).toBe(StatusShipment.ANALYZING);

      // 2. Em análise -> Em inspeção
      const inspection = await sendToInspectionUseCase.execute(
        shipment.id,
        actor,
      );
      expect(inspection.status).toBe(StatusShipment.INSPECTION);

      // 3. Em inspeção -> Liberada
      const released = await releaseUseCase.execute(shipment.id, actor);
      expect(released.status).toBe(StatusShipment.APPROVED);

      // 4. Liberada -> Em movimentação
      const transit = await startTransitUseCase.execute(shipment.id, actor);
      expect(transit.status).toBe(StatusShipment.IN_TRANSIT);

      // 5. Em movimentação -> Finalizada
      const completed = await completeUseCase.execute(shipment.id, actor);
      expect(completed.status).toBe(StatusShipment.COMPLETED);

      // Verifica auditoria de todas as etapas
      expect(auditLogs.logs).toHaveLength(5);
      expect(auditLogs.logs[0]).toMatchObject({
        entityType: AuditedEntity.CHEMICAL_SHIPMENT,
        action: AuditAction.STATUS_CHANGED,
        details: { from: StatusShipment.REGISTERED, to: StatusShipment.ANALYZING },
      });
      expect(auditLogs.logs[4]).toMatchObject({
        entityType: AuditedEntity.CHEMICAL_SHIPMENT,
        action: AuditAction.STATUS_CHANGED,
        details: { from: StatusShipment.IN_TRANSIT, to: StatusShipment.COMPLETED },
      });
    });

    it('ReleaseChemicalShipmentUseCase bloqueia liberação sem documentação obrigatória', async () => {
      const shipment = await createRegisteredShipment();
      await startAnalysisUseCase.execute(shipment.id);
      await sendToInspectionUseCase.execute(shipment.id);

      // docChecker não contém a carga
      await expect(releaseUseCase.execute(shipment.id)).rejects.toThrow(
        'Uma carga não pode ser liberada sem documentação obrigatória.',
      );

      const unchanged = await shipmentsRepo.findById(shipment.id);
      expect(unchanged?.status).toBe(StatusShipment.INSPECTION);
    });

    it('BlockChemicalShipmentUseCase bloqueia a carga a partir de inspeção', async () => {
      const shipment = await createRegisteredShipment();
      await startAnalysisUseCase.execute(shipment.id);
      await sendToInspectionUseCase.execute(shipment.id);

      const blocked = await blockUseCase.execute(shipment.id);
      expect(blocked.status).toBe(StatusShipment.REPROVED);

      // Tentativa de movimentar carga bloqueada deve falhar
      await expect(startTransitUseCase.execute(shipment.id)).rejects.toThrow(
        'Uma carga bloqueada não pode entrar em movimentação.',
      );
    });

    it('CancelChemicalShipmentUseCase cancela a carga e encerra transições', async () => {
      const shipment = await createRegisteredShipment();
      const cancelled = await cancelUseCase.execute(shipment.id);
      expect(cancelled.status).toBe(StatusShipment.CANCELLED);

      // Carga cancelada não pode ser liberada nem reativada
      await expect(releaseUseCase.execute(shipment.id)).rejects.toThrow(
        'Uma carga cancelada não pode ser liberada.',
      );
    });

    it('lança ResourceNotFoundError se a carga não existir', async () => {
      await expect(startAnalysisUseCase.execute('id-inexistente')).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });

  describe('ChangeChemicalShipmentStatusUseCase (Orquestrador do PATCH /:id/status)', () => {
    it('delega corretamente para cada use case especializado', async () => {
      const shipment = await createRegisteredShipment();
      docChecker.markAsDocumented(shipment.id);

      const s1 = await changeStatusUseCase.execute(
        shipment.id,
        StatusShipment.ANALYZING,
      );
      expect(s1.status).toBe(StatusShipment.ANALYZING);

      const s2 = await changeStatusUseCase.execute(
        shipment.id,
        StatusShipment.INSPECTION,
      );
      expect(s2.status).toBe(StatusShipment.INSPECTION);

      const s3 = await changeStatusUseCase.execute(
        shipment.id,
        StatusShipment.APPROVED,
      );
      expect(s3.status).toBe(StatusShipment.APPROVED);

      const s4 = await changeStatusUseCase.execute(
        shipment.id,
        StatusShipment.IN_TRANSIT,
      );
      expect(s4.status).toBe(StatusShipment.IN_TRANSIT);

      const s5 = await changeStatusUseCase.execute(
        shipment.id,
        StatusShipment.COMPLETED,
      );
      expect(s5.status).toBe(StatusShipment.COMPLETED);
    });

    it('rejeita transição para status inválido ou proibido', async () => {
      const shipment = await createRegisteredShipment();
      await expect(
        changeStatusUseCase.execute(shipment.id, 'STATUS_INEXISTENTE' as any),
      ).rejects.toThrow(BusinessRuleError);
    });
  });
});
