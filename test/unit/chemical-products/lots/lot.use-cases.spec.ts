import { ApproveLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/approve-lot.use-case.js';
import { CancelLotReservationUseCase } from '@/modules/chemical-products/application/use-cases/lots/cancel-lot-reservation.use-case.js';
import { CreateLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/create-lot.use-case.js';
import { DisposeLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/dispose-lot.use-case.js';
import { ExpireLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/expire-lot.use-case.js';
import { FindLotByIdUseCase } from '@/modules/chemical-products/application/use-cases/lots/find-lot-by-id.use-case.js';
import { ListLotsUseCase } from '@/modules/chemical-products/application/use-cases/lots/list-lots.use-case.js';
import { QuarantineLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/quarantine-lot.use-case.js';
import { ReleaseLotFromQuarantineUseCase } from '@/modules/chemical-products/application/use-cases/lots/release-lot-from-quarantine.use-case.js';
import { ReleaseLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/release-lot.use-case.js';
import { ReserveLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/reserve-lot.use-case.js';
import { StartLotInspectionUseCase } from '@/modules/chemical-products/application/use-cases/lots/start-lot-inspection.use-case.js';
import { StoreLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/store-lot.use-case.js';
import { UpdateLotUseCase } from '@/modules/chemical-products/application/use-cases/lots/update-lot.use-case.js';
import { WithdrawLotFromStorageUseCase } from '@/modules/chemical-products/application/use-cases/lots/withdraw-lot-from-storage.use-case.js';
import { ChemicalProduct } from '@/modules/chemical-products/domain/entities/chemical-product.entity.js';
import { Lot } from '@/modules/chemical-products/domain/entities/lot.entity.js';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { ChemicalProductRepositoryMock } from '../../../mocks/chemical-product-repository.mock.js';
import { LotRepositoryMock } from '../../../mocks/lot-repository.mock.js';

describe('Casos de uso de lotes', () => {
  let products: ChemicalProductRepositoryMock;
  let lots: LotRepositoryMock;
  let activeProduct: ChemicalProduct;

  beforeEach(async () => {
    products = new ChemicalProductRepositoryMock();
    lots = new LotRepositoryMock();
    activeProduct = await registerProduct('H2SO4-98', ProductStatus.ACTIVE);
  });

  async function registerProduct(code: string, status: ProductStatus): Promise<ChemicalProduct> {
    return products.create(
      ChemicalProduct.create({
        code,
        technicalName: 'Produto de teste',
        unNumber: '1830',
        riskClass: ProductRiskClass.CORROSIVE_SUBSTANCES,
        physicalState: ProductPhysicalState.LIQUID,
        responsibleUserId: 'user-001',
        status,
      }),
    );
  }

  async function registerLot(status: LotStatus = LotStatus.RECEIVED, lotNumber = 'L1'): Promise<Lot> {
    const lot = Lot.create({ chemicalProductId: activeProduct.id, lotNumber, quantity: 100 });

    if (status !== LotStatus.RECEIVED) {
      lot.startInspection();
    }
    if (status === LotStatus.AVAILABLE || status === LotStatus.RESERVED) {
      lot.approve();
    }
    if (status === LotStatus.RESERVED) {
      lot.reserve('OP-1');
    }

    return lots.create(lot);
  }

  describe('CreateLotUseCase', () => {
    let useCase: CreateLotUseCase;

    beforeEach(() => {
      useCase = new CreateLotUseCase(products, lots);
    });

    it('registra um lote RECEIVED para um produto ativo', async () => {
      const lot = await useCase.execute(activeProduct.id, { lotNumber: 'l2026-01', quantity: 50 });

      expect(lot.status).toBe(LotStatus.RECEIVED);
      expect(lot.lotNumber).toBe('L2026-01');
      expect(lot.chemicalProductId).toBe(activeProduct.id);
      expect(await lots.findById(lot.id)).not.toBeNull();
    });

    it('lança erro quando o produto não existe', async () => {
      await expect(
        useCase.execute('id-inexistente', { lotNumber: 'L1', quantity: 1 }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('rejeita lotes para produtos que não estão ativos', async () => {
      const blocked = await registerProduct('NH3-01', ProductStatus.BLOCKED);
      const underAnalysis = await registerProduct('CL2-01', ProductStatus.UNDER_ANALYSIS);

      await expect(useCase.execute(blocked.id, { lotNumber: 'L1', quantity: 1 })).rejects.toThrow(
        BusinessRuleError,
      );
      await expect(
        useCase.execute(underAnalysis.id, { lotNumber: 'L1', quantity: 1 }),
      ).rejects.toThrow(BusinessRuleError);
    });

    it('rejeita número de lote repetido no mesmo produto, ignorando caixa', async () => {
      await useCase.execute(activeProduct.id, { lotNumber: 'L1', quantity: 1 });

      await expect(useCase.execute(activeProduct.id, { lotNumber: 'l1', quantity: 2 })).rejects.toThrow(
        ConflictError,
      );
    });

    it('permite o mesmo número de lote em produtos diferentes', async () => {
      const other = await registerProduct('NH3-01', ProductStatus.ACTIVE);

      await useCase.execute(activeProduct.id, { lotNumber: 'L1', quantity: 1 });
      await expect(useCase.execute(other.id, { lotNumber: 'L1', quantity: 1 })).resolves.toBeDefined();
    });
  });

  describe('ListLotsUseCase e FindLotByIdUseCase', () => {
    it('lista os lotes do produto com paginação padrão e filtro por status', async () => {
      await registerLot(LotStatus.RECEIVED, 'L1');
      await registerLot(LotStatus.AVAILABLE, 'L2');
      const useCase = new ListLotsUseCase(products, lots);

      const all = await useCase.execute(activeProduct.id);
      expect(all).toMatchObject({ total: 2, page: 1, pageSize: 20 });

      const available = await useCase.execute(activeProduct.id, { status: LotStatus.AVAILABLE });
      expect(available.items.map((lot) => lot.lotNumber)).toEqual(['L2']);
    });

    it('lança erro ao listar lotes de um produto inexistente', async () => {
      const useCase = new ListLotsUseCase(products, lots);

      await expect(useCase.execute('id-inexistente')).rejects.toThrow(ResourceNotFoundError);
    });

    it('busca um lote pelo id apenas dentro do produto correto', async () => {
      const lot = await registerLot();
      const other = await registerProduct('NH3-01', ProductStatus.ACTIVE);
      const useCase = new FindLotByIdUseCase(lots);

      await expect(useCase.execute(activeProduct.id, lot.id)).resolves.toBe(lot);
      await expect(useCase.execute(other.id, lot.id)).rejects.toThrow(ResourceNotFoundError);
      await expect(useCase.execute(activeProduct.id, 'lote-inexistente')).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });

  describe('UpdateLotUseCase', () => {
    let useCase: UpdateLotUseCase;

    beforeEach(() => {
      useCase = new UpdateLotUseCase(lots);
    });

    it('corrige número e quantidade durante a conferência', async () => {
      const lot = await registerLot();

      const updated = await useCase.execute(activeProduct.id, lot.id, {
        lotNumber: 'l1-a',
        quantity: 90,
      });

      expect(updated.lotNumber).toBe('L1-A');
      expect(updated.quantity).toBe(90);
    });

    it('rejeita número já usado por outro lote do produto', async () => {
      await registerLot(LotStatus.RECEIVED, 'TAKEN');
      const lot = await registerLot(LotStatus.RECEIVED, 'FREE');

      await expect(useCase.execute(activeProduct.id, lot.id, { lotNumber: 'taken' })).rejects.toThrow(
        ConflictError,
      );
    });

    it('rejeita correções depois da conferência', async () => {
      const lot = await registerLot(LotStatus.AVAILABLE);

      await expect(useCase.execute(activeProduct.id, lot.id, { quantity: 1 })).rejects.toThrow(
        BusinessRuleError,
      );
    });
  });

  describe('transições de status', () => {
    it('percorre o fluxo completo de um lote até a saída do porto', async () => {
      const lot = await registerLot();

      await new StartLotInspectionUseCase(lots).execute(activeProduct.id, lot.id);
      await new ApproveLotUseCase(lots).execute(activeProduct.id, lot.id);
      await new StoreLotUseCase(lots).execute(activeProduct.id, lot.id);
      await new WithdrawLotFromStorageUseCase(lots).execute(activeProduct.id, lot.id);
      await new ReserveLotUseCase(lots).execute(activeProduct.id, lot.id, { operationId: 'OP-1' });
      await new CancelLotReservationUseCase(lots).execute(activeProduct.id, lot.id);
      await new ReserveLotUseCase(lots).execute(activeProduct.id, lot.id, { operationId: 'OP-2' });

      await expect(
        new ReleaseLotUseCase(lots).execute(activeProduct.id, lot.id, { operationId: 'OP-1' }),
      ).rejects.toThrow(BusinessRuleError);

      const released = await new ReleaseLotUseCase(lots).execute(activeProduct.id, lot.id, {
        operationId: 'OP-2',
      });

      expect(released.status).toBe(LotStatus.RELEASED);
      expect((await lots.findById(lot.id))?.status).toBe(LotStatus.RELEASED);
    });

    it('quarentena, liberação, vencimento e descarte', async () => {
      const lot = await registerLot(LotStatus.AVAILABLE);

      const quarantined = await new QuarantineLotUseCase(lots).execute(activeProduct.id, lot.id);
      expect(quarantined.status).toBe(LotStatus.QUARANTINED);

      const available = await new ReleaseLotFromQuarantineUseCase(lots).execute(
        activeProduct.id,
        lot.id,
      );
      expect(available.status).toBe(LotStatus.AVAILABLE);

      const expired = await new ExpireLotUseCase(lots).execute(activeProduct.id, lot.id);
      expect(expired.status).toBe(LotStatus.EXPIRED);

      const disposed = await new DisposeLotUseCase(lots).execute(activeProduct.id, lot.id);
      expect(disposed.status).toBe(LotStatus.DISPOSED);
    });

    it('transições inválidas são rejeitadas sem alterar o lote', async () => {
      const lot = await registerLot();

      await expect(new ApproveLotUseCase(lots).execute(activeProduct.id, lot.id)).rejects.toThrow(
        BusinessRuleError,
      );
      await expect(new DisposeLotUseCase(lots).execute(activeProduct.id, lot.id)).rejects.toThrow(
        BusinessRuleError,
      );
      expect((await lots.findById(lot.id))?.status).toBe(LotStatus.RECEIVED);
    });

    it('lança erro para lote inexistente ou de outro produto', async () => {
      const lot = await registerLot();
      const other = await registerProduct('NH3-01', ProductStatus.ACTIVE);

      await expect(
        new StartLotInspectionUseCase(lots).execute(other.id, lot.id),
      ).rejects.toThrow(ResourceNotFoundError);
      await expect(
        new StartLotInspectionUseCase(lots).execute(activeProduct.id, 'nope'),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
