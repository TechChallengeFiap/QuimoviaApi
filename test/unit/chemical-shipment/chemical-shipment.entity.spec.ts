import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

function createValidShipment(
  override: Partial<Parameters<typeof ChemicalShipment.create>[0]> = {},
) {
  return ChemicalShipment.create({
    productId: 'prod-001',
    responsibleUserId: 'user-001',
    documentsIds: 'doc-001',
    quantityProduct: 100,
    ...override,
  });
}

function shipmentIn(status: StatusShipment) {
  return ChemicalShipment.restore({
    ...createValidShipment().toObject(),
    status,
  });
}

const S = StatusShipment;
const ALL_STATUSES = Object.values(S);

const ALLOWED_TRANSITIONS: Array<[StatusShipment, StatusShipment]> = [
  [S.REGISTERED, S.ANALYZING],
  [S.ANALYZING, S.INSPECTION],
  [S.INSPECTION, S.APPROVED],
  [S.INSPECTION, S.REPROVED],
  [S.APPROVED, S.IN_TRANSIT],
  [S.IN_TRANSIT, S.COMPLETED],
  [S.REGISTERED, S.CANCELLED],
  [S.ANALYZING, S.CANCELLED],
  [S.INSPECTION, S.CANCELLED],
  [S.APPROVED, S.CANCELLED],
  [S.REPROVED, S.CANCELLED],
];

const isAllowed = (from: StatusShipment, to: StatusShipment) =>
  ALLOWED_TRANSITIONS.some(([f, t]) => f === from && t === to);

const FORBIDDEN_TRANSITIONS: Array<[StatusShipment, StatusShipment]> =
  ALL_STATUSES.flatMap((from) =>
    ALL_STATUSES.filter((to) => !isAllowed(from, to)).map(
      (to) => [from, to] as [StatusShipment, StatusShipment],
    ),
  );

describe('ChemicalShipment Entity', () => {
  it('cria uma carga química com status REGISTERED por padrão', () => {
    const shipment = createValidShipment();

    expect(shipment.id).toBeDefined();
    expect(shipment.status).toBe(StatusShipment.REGISTERED);
    expect(shipment.productId).toBe('prod-001');
    expect(shipment.responsibleUserId).toBe('user-001');
    expect(shipment.documentsIds).toBe('doc-001');
    expect(shipment.quantityProduct).toBe(100);
    expect(shipment.createdAt).toBeInstanceOf(Date);
    expect(shipment.updatedAt).toBeInstanceOf(Date);
    expect(shipment.deletedAt).toBeNull();
  });

  it('rejeita criação com quantidade menor ou igual a zero', () => {
    expect(() => createValidShipment({ quantityProduct: 0 })).toThrow(
      BusinessRuleError,
    );
    expect(() => createValidShipment({ quantityProduct: -10 })).toThrow(
      BusinessRuleError,
    );
    expect(() =>
      createValidShipment({ quantityProduct: undefined as any }),
    ).toThrow(BusinessRuleError);
  });

  it('permite alterar o produto químico', () => {
    const shipment = createValidShipment();
    shipment.changeProduct('prod-002');
    expect(shipment.productId).toBe('prod-002');
  });

  it('permite alterar o usuário responsável', () => {
    const shipment = createValidShipment();
    shipment.changeResponsibleUser('user-002');
    expect(shipment.responsibleUserId).toBe('user-002');
  });

  it('permite alterar os documentos anexados', () => {
    const shipment = createValidShipment();
    shipment.changeDocuments('doc-002');
    expect(shipment.documentsIds).toBe('doc-002');
  });

  it('permite alterar a quantidade do produto e rejeita valores <= 0', () => {
    const shipment = createValidShipment();
    shipment.changeQuantityProduct(250);
    expect(shipment.quantityProduct).toBe(250);

    expect(() => shipment.changeQuantityProduct(0)).toThrow(BusinessRuleError);
    expect(() => shipment.changeQuantityProduct(-5)).toThrow(BusinessRuleError);

    shipment.quantityProduct = 350;
    expect(shipment.quantityProduct).toBe(350);
    expect(() => {
      shipment.quantityProduct = 0;
    }).toThrow(BusinessRuleError);
    expect(() => {
      shipment.quantityProduct = -10;
    }).toThrow(BusinessRuleError);
  });

  it('converte corretamente para objeto com toObject()', () => {
    const shipment = createValidShipment();
    const obj = shipment.toObject();

    expect(obj.id).toBe(shipment.id);
    expect(obj.productId).toBe('prod-001');
    expect(obj.quantityProduct).toBe(100);
    expect(obj.responsibleUserId).toBe('user-001');
    expect(obj.documentsIds).toBe('doc-001');
    expect(obj.status).toBe(StatusShipment.REGISTERED);
  });

  describe('Máquina de Estados e Ciclo de Vida da Carga', () => {
    it.each(ALLOWED_TRANSITIONS)(
      'permite transição válida: %s → %s',
      (from, to) => {
        const shipment = shipmentIn(from);
        shipment.changeStatus(to, { hasRequiredDocumentation: true });
        expect(shipment.status).toBe(to);
      },
    );

    it.each(FORBIDDEN_TRANSITIONS)(
      'bloqueia transição proibida: %s → %s',
      (from, to) => {
        const shipment = shipmentIn(from);
        expect(() =>
          shipment.changeStatus(to, { hasRequiredDocumentation: true }),
        ).toThrow(BusinessRuleError);
        expect(shipment.status).toBe(from);
      },
    );

    it.each([
      [S.CANCELLED, S.APPROVED, 'cancelada não pode ser liberada'],
      [S.COMPLETED, S.IN_TRANSIT, 'finalizada não pode sofrer'],
      [S.REPROVED, S.IN_TRANSIT, 'bloqueada não pode entrar em movimentação'],
      [S.REGISTERED, S.COMPLETED, 'Transição de status inválida'],
      [S.INSPECTION, S.COMPLETED, 'sem antes ser liberada'],
      [S.APPROVED, S.REGISTERED, 'Transição de status inválida'],
    ])('valida mensagem do edital para transição: %s → %s', (from, to, expectedMessage) => {
      expect(() =>
        shipmentIn(from).changeStatus(to, { hasRequiredDocumentation: true }),
      ).toThrow(expectedMessage);
    });

    it('bloqueia liberação de carga em inspeção sem documentação obrigatória', () => {
      const shipment = shipmentIn(S.INSPECTION);
      expect(() => shipment.release(false)).toThrow(
        'Uma carga não pode ser liberada sem documentação obrigatória.',
      );
      expect(shipment.status).toBe(S.INSPECTION);
    });

    it('permite liberação de carga em inspeção com documentação obrigatória', () => {
      const shipment = shipmentIn(S.INSPECTION);
      shipment.release(true);
      expect(shipment.status).toBe(S.APPROVED);
    });

    it.each([S.REGISTERED, S.ANALYZING, S.INSPECTION, S.APPROVED, S.REPROVED])(
      'permite cancelamento a partir do status %s',
      (from) => {
        const shipment = shipmentIn(from);
        shipment.cancel();
        expect(shipment.status).toBe(S.CANCELLED);
        expect(shipment.isTerminal).toBe(true);
      },
    );

    it('método block() move a carga de inspeção para reprovada/bloqueada', () => {
      const shipment = shipmentIn(S.INSPECTION);
      shipment.block();
      expect(shipment.status).toBe(S.REPROVED);
    });

    it('impede movimentação de carga bloqueada', () => {
      const shipment = shipmentIn(S.REPROVED);
      expect(() => shipment.startTransit()).toThrow(
        'Uma carga bloqueada não pode entrar em movimentação.',
      );
    });

    it.each([
      S.INSPECTION,
      S.APPROVED,
      S.REPROVED,
      S.IN_TRANSIT,
      S.COMPLETED,
      S.CANCELLED,
    ])('bloqueia edição de dados da carga no status %s', (status) => {
      const shipment = shipmentIn(status);

      expect(() => shipment.changeProduct('prod-999')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeResponsibleUser('user-999')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeDocuments('doc-999')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeQuantityProduct(500)).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeCode('NEW-CODE')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeUnit('litros')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeOrigin('Santos')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeDestination('Mauá')).toThrow(
        BusinessRuleError,
      );
      expect(() => shipment.changeEntryDate(new Date())).toThrow(
        BusinessRuleError,
      );
    });

    it('inicializa e permite alterar os campos adicionais do edital (code, unit, origin, destination, entryDate)', () => {
      const entryDate = new Date('2026-10-24T12:00:00.000Z');
      const shipment = ChemicalShipment.create({
        productId: 'prod-001',
        responsibleUserId: 'user-001',
        documentsIds: 'doc-001',
        quantityProduct: 500,
        code: 'CARGO-2026-XYZ',
        unit: 'toneladas',
        origin: 'Porto de Santos',
        destination: 'Terminal Mauá',
        entryDate,
      });

      expect(shipment.code).toBe('CARGO-2026-XYZ');
      expect(shipment.unit).toBe('toneladas');
      expect(shipment.origin).toBe('Porto de Santos');
      expect(shipment.destination).toBe('Terminal Mauá');
      expect(shipment.entryDate).toEqual(entryDate);

      shipment.changeCode('CARGO-2026-ABC');
      shipment.changeUnit('kg');
      shipment.changeOrigin('Terminal Saboó');
      shipment.changeDestination('Terminal Cubatão');
      shipment.changeEntryDate('2026-10-25T14:30:00.000Z');

      expect(shipment.code).toBe('CARGO-2026-ABC');
      expect(shipment.unit).toBe('kg');
      expect(shipment.origin).toBe('Terminal Saboó');
      expect(shipment.destination).toBe('Terminal Cubatão');
      expect(shipment.entryDate).toEqual(new Date('2026-10-25T14:30:00.000Z'));
    });

    it('rejeita valores vazios ou inválidos para os campos adicionais', () => {
      const shipment = createValidShipment();

      expect(() => shipment.changeCode('')).toThrow(BusinessRuleError);
      expect(() => shipment.changeUnit('')).toThrow(BusinessRuleError);
      expect(() => shipment.changeOrigin('')).toThrow(BusinessRuleError);
      expect(() => shipment.changeDestination('')).toThrow(BusinessRuleError);
      expect(() => shipment.changeEntryDate('data-invalida')).toThrow(
        BusinessRuleError,
      );
    });
  });
});
