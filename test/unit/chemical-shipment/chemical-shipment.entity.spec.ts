import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';

function createValidShipment(
  override: Partial<Parameters<typeof ChemicalShipment.create>[0]> = {},
) {
  return ChemicalShipment.create({
    productId: 'prod-001',
    responsibleUserId: 'user-001',
    documentsIds: 'doc-001',
    ...override,
  });
}

describe('ChemicalShipment', () => {
  describe('cadastro', () => {
    it('cria uma carga em análise, sem remoção registrada', () => {
      const shipment = createValidShipment();

      expect(shipment.id).toEqual(expect.any(String));
      expect(shipment.status).toBe(StatusShipment.ANALYZING);
      expect(shipment.productId).toBe('prod-001');
      expect(shipment.responsibleUserId).toBe('user-001');
      expect(shipment.documentsIds).toBe('doc-001');
      expect(shipment.deletedAt).toBeNull();
      expect(shipment.updatedAt).toEqual(shipment.createdAt);
    });

    it.each([
      ['productId', { productId: '' }],
      ['responsibleUserId', { responsibleUserId: '' }],
      ['documentsIds', { documentsIds: '' }],
    ])('exige o %s', (field, override) => {
      expect(() => createValidShipment(override)).toThrow(
        new BusinessRuleError(`O ${field} não pode estar vazio`),
      );
    });
  });

  describe('alterações', () => {
    it('altera status, produto, responsável e documentos de uma carga em análise', () => {
      const shipment = createValidShipment();

      shipment.changeStatus(StatusShipment.INSPECTION);
      shipment.changeProduct('prod-002');
      shipment.changeResponsibleUser('user-002');
      shipment.changeDocuments('doc-002');

      expect(shipment.toObject()).toMatchObject({
        status: StatusShipment.INSPECTION,
        productId: 'prod-002',
        responsibleUserId: 'user-002',
        documentsIds: 'doc-002',
      });
    });

    it('não aceita um identificador vazio numa alteração', () => {
      const shipment = createValidShipment();

      expect(() => shipment.changeProduct('')).toThrow(BusinessRuleError);
      expect(shipment.productId).toBe('prod-001');
    });

    it.each([
      [StatusShipment.APPROVED, 'Não é possível alterar uma carga química aprovada'],
      [StatusShipment.REPROVED, 'Não é possível alterar uma carga química reprovada'],
    ])('não altera uma carga com status %s', (status, message) => {
      const shipment = createValidShipment();
      shipment.changeStatus(status);

      expect(() => shipment.changeStatus(StatusShipment.ANALYZING)).toThrow(
        new BusinessRuleError(message),
      );
      expect(() => shipment.changeProduct('prod-002')).toThrow(message);
      expect(() => shipment.changeResponsibleUser('user-002')).toThrow(message);
      expect(() => shipment.changeDocuments('doc-002')).toThrow(message);
      expect(shipment.status).toBe(status);
    });
  });
});
