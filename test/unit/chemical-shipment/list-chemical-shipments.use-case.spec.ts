import {
  ListChemicalShipmentsUseCase,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from '@/modules/chemical-shipment/application/use-cases/chemical-shipments/list-chemical-shipments.use-case.js';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { jest } from '@jest/globals';
import { ChemicalShipmentMock } from '../../mocks/chemical-shipment.mock.js';
import {
  UserDirectoryMock,
  userSummary,
} from '../../mocks/user-directory.mock.js';

describe('ListChemicalShipmentsUseCase', () => {
  let chemicalShipments: ChemicalShipmentMock;
  let users: UserDirectoryMock;
  let useCase: ListChemicalShipmentsUseCase;

  const createShipment = (props: {
    id: string;
    status?: StatusShipment;
    productId?: string;
    responsibleUserId?: string;
    documentsIds?: string;
  }): ChemicalShipment => {
    const now = new Date();
    return ChemicalShipment.restore({
      id: props.id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: props.status ?? StatusShipment.ANALYZING,
      productId: props.productId ?? 'prod-001',
      responsibleUserId: props.responsibleUserId ?? 'user-001',
      documentsIds: props.documentsIds ?? 'doc-001',
    });
  };

  beforeEach(() => {
    chemicalShipments = new ChemicalShipmentMock();
    users = new UserDirectoryMock([
      userSummary({ id: 'user-001', name: 'Operador Teste' }),
      userSummary({ id: 'user-002', name: 'Segundo Operador' }),
    ]);
    useCase = new ListChemicalShipmentsUseCase(chemicalShipments, users);
  });

  describe('Paginação e conversão de parâmetros', () => {
    it('deve usar os valores padrão de paginação quando não fornecidos', async () => {
      const result = await useCase.execute();

      expect(result.page).toBe(DEFAULT_PAGE);
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('deve converter page e pageSize para número quando fornecidos como string', async () => {
      const result = await useCase.execute({
        page: '2' as unknown as number,
        pageSize: '10' as unknown as number,
      });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('deve paginar corretamente os resultados', async () => {
      await chemicalShipments.create(createShipment({ id: '1' }));
      await chemicalShipments.create(createShipment({ id: '2' }));
      await chemicalShipments.create(createShipment({ id: '3' }));

      const page1 = await useCase.execute({ page: 1, pageSize: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.items[0]?.shipment.id).toBe('1');
      expect(page1.items[1]?.shipment.id).toBe('2');
      expect(page1.total).toBe(3);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);

      const page2 = await useCase.execute({ page: 2, pageSize: 2 });
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0]?.shipment.id).toBe('3');
      expect(page2.total).toBe(3);
      expect(page2.page).toBe(2);
      expect(page2.pageSize).toBe(2);
    });
  });

  describe('Responsáveis', () => {
    it('busca os responsáveis da página numa única consulta ao contrato de usuários', async () => {
      await chemicalShipments.create(
        createShipment({ id: 'ship-1', responsibleUserId: 'user-001' }),
      );
      await chemicalShipments.create(
        createShipment({ id: 'ship-2', responsibleUserId: 'user-002' }),
      );
      await chemicalShipments.create(
        createShipment({ id: 'ship-3', responsibleUserId: 'user-removido' }),
      );
      const findByIds = jest.spyOn(users, 'findByIds');

      const result = await useCase.execute();

      expect(findByIds).toHaveBeenCalledTimes(1);
      expect(
        result.items.map((item) => [
          item.shipment.id,
          item.responsibleUser?.name ?? null,
        ]),
      ).toEqual([
        ['ship-1', 'Operador Teste'],
        ['ship-2', 'Segundo Operador'],
        ['ship-3', null],
      ]);
    });
  });

  describe('Filtros de busca', () => {
    beforeEach(async () => {
      await chemicalShipments.create(
        createShipment({
          id: 'ship-1',
          status: StatusShipment.ANALYZING,
          productId: 'prod-001',
          responsibleUserId: 'user-001',
          documentsIds: 'doc-001',
        }),
      );
      await chemicalShipments.create(
        createShipment({
          id: 'ship-2',
          status: StatusShipment.INSPECTION,
          productId: 'prod-002',
          responsibleUserId: 'user-001',
          documentsIds: 'doc-002',
        }),
      );
      await chemicalShipments.create(
        createShipment({
          id: 'ship-3',
          status: StatusShipment.APPROVED,
          productId: 'prod-001',
          responsibleUserId: 'user-002',
          documentsIds: 'doc-003',
        }),
      );
    });

    it('deve filtrar cargas pelo status', async () => {
      const result = await useCase.execute({
        status: StatusShipment.INSPECTION,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.shipment.id).toBe('ship-2');
      expect(result.items[0]?.shipment.status).toBe(
        StatusShipment.INSPECTION,
      );
      expect(result.total).toBe(1);
    });

    it('deve filtrar cargas pelo productId', async () => {
      const result = await useCase.execute({ productId: 'prod-001' });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.shipment.id)).toEqual([
        'ship-1',
        'ship-3',
      ]);
      expect(result.total).toBe(2);
    });

    it('deve filtrar cargas pelo responsibleUserId', async () => {
      const result = await useCase.execute({ responsibleUserId: 'user-001' });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.shipment.id)).toEqual([
        'ship-1',
        'ship-2',
      ]);
      expect(result.total).toBe(2);
    });

    it('deve filtrar cargas pelo documentsIds', async () => {
      const result = await useCase.execute({ documentsIds: 'doc-003' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.shipment.id).toBe('ship-3');
      expect(result.items[0]?.shipment.documentsIds).toBe('doc-003');
      expect(result.total).toBe(1);
    });

    it('deve combinar múltiplos filtros simultaneamente', async () => {
      const result = await useCase.execute({
        status: StatusShipment.ANALYZING,
        productId: 'prod-001',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.shipment.id).toBe('ship-1');
      expect(result.total).toBe(1);
    });

    it('deve retornar lista vazia quando nenhum registro corresponder aos filtros', async () => {
      const result = await useCase.execute({
        productId: 'prod-inexistente',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('deve retornar lista vazia quando combinação de filtros não encontra correspondência', async () => {
      const result = await useCase.execute({
        status: StatusShipment.APPROVED,
        productId: 'prod-002',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
