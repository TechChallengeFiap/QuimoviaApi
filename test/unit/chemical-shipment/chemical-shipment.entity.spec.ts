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

describe('ChemicalShipment Entity', () => {
  it('cria uma carga química com status ANALYZING por padrão', () => {
    const shipment = createValidShipment();

    expect(shipment.id).toBeDefined();
    expect(shipment.status).toBe(StatusShipment.ANALYZING);
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

  it('permite atualizar status de uma carga em análise', () => {
    const shipment = createValidShipment();
    const originalUpdatedAt = shipment.updatedAt;

    shipment.updateStatus(StatusShipment.INSPECTION);

    expect(shipment.status).toBe(StatusShipment.INSPECTION);
    expect(shipment.updatedAt.getTime()).toBeGreaterThanOrEqual(
      originalUpdatedAt.getTime(),
    );
  });

  it('suporta updateChemicalShipmentStatus com sobrecarga', () => {
    const shipment = createValidShipment();
    shipment.updateChemicalShipmentStatus(StatusShipment.INSPECTION);
    expect(shipment.status).toBe(StatusShipment.INSPECTION);

    shipment.updateChemicalShipmentStatus(shipment, StatusShipment.ANALYZING);
    expect(shipment.status).toBe(StatusShipment.ANALYZING);
  });

  it('não permite alterar status de carga reprovada', () => {
    const shipment = createValidShipment();
    shipment.updateStatus(StatusShipment.REPROVED);

    expect(() => shipment.updateStatus(StatusShipment.APPROVED)).toThrow(
      BusinessRuleError,
    );
  });

  it('não permite alterar status de carga aprovada', () => {
    const shipment = createValidShipment();
    shipment.updateStatus(StatusShipment.APPROVED);

    expect(() => shipment.updateStatus(StatusShipment.INSPECTION)).toThrow(
      BusinessRuleError,
    );
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

  it('bloqueia alterações de atributos quando a carga já foi aprovada ou reprovada', () => {
    const approvedShipment = createValidShipment();
    approvedShipment.updateStatus(StatusShipment.APPROVED);

    expect(() => approvedShipment.changeProduct('prod-999')).toThrow(
      BusinessRuleError,
    );
    expect(() => approvedShipment.changeResponsibleUser('user-999')).toThrow(
      BusinessRuleError,
    );
    expect(() => approvedShipment.changeDocuments('doc-999')).toThrow(
      BusinessRuleError,
    );
    expect(() => approvedShipment.changeQuantityProduct(500)).toThrow(
      BusinessRuleError,
    );
    expect(() => {
      approvedShipment.quantityProduct = 500;
    }).toThrow(BusinessRuleError);

    const reprovedShipment = createValidShipment();
    reprovedShipment.updateStatus(StatusShipment.REPROVED);

    expect(() => reprovedShipment.changeProduct('prod-999')).toThrow(
      BusinessRuleError,
    );
    expect(() => {
      reprovedShipment.quantityProduct = 500;
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
    expect(obj.status).toBe(StatusShipment.ANALYZING);
  });
});
