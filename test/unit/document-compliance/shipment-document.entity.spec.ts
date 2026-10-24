import type { DocumentScope } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { randomUUID } from 'node:crypto';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';
import {
  BusinessRuleError,
  ConflictError,
} from '@/shared/domain/errors/domain.error.js';
import {
  createAttachmentData,
  createShipmentDocumentData,
} from '../../mocks/shipment-document.fixture.js';

describe('ShipmentDocument', () => {
  it('preserves the responsible user when attachment validation fails', () => {
    const originalUser = { id: randomUUID(), name: 'Maria Silva' };
    const document = ShipmentDocument.restore({
      ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
      responsibleUserId: originalUser.id,
      responsibleUser: originalUser,
    });
    const before = document.toObject();
    expect(() =>
      document.revise({
        responsibleUserId: randomUUID(),
        attachments: [createAttachmentData({ name: ' ' })],
      }),
    ).toThrow(BusinessRuleError);
    expect(document.toObject()).toEqual(before);
  });

  it('protects the responsible user summary and clears it when the identifier changes', () => {
    const originalUser = { id: randomUUID(), name: 'Maria Silva' };
    const document = ShipmentDocument.restore({
      ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
      responsibleUserId: originalUser.id,
      responsibleUser: originalUser,
    });
    document.responsibleUser!.name = 'Changed externally';
    expect(document.responsibleUser?.name).toBe(originalUser.name);
    document.revise({ responsibleUserId: originalUser.id.toUpperCase() });
    expect(document.responsibleUser).toEqual(originalUser);
    const replacementId = randomUUID();
    document.revise({ responsibleUserId: replacementId.toUpperCase() });
    expect(document.responsibleUserId).toBe(replacementId);
    expect(document.responsibleUser).toBeNull();
  });

  it('inicia em preparação e permite não possuir anexos antes do envio', () => {
    const document = ShipmentDocument.create(
      createShipmentDocumentData({ attachments: [] }),
    );
    expect(document.status).toBe(ShipmentDocumentStatus.PENDING);
    expect(document.submittedAt).toBeNull();
    expect(document.attachments).toEqual([]);
    expect(document.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    { shipmentId: '' },
    { shipperId: 'inválido' },
    { compositionVersion: 0 },
    { compositionVersion: 1.5 },
    { compositionVersion: 2147483648 },
  ])('rejeita cadastro inválido: %j', (overrides) => {
    expect(() =>
      ShipmentDocument.create(createShipmentDocumentData(overrides)),
    ).toThrow(BusinessRuleError);
  });

  it('normaliza os identificadores para evitar duplicação por caixa', () => {
    const input = createShipmentDocumentData();
    const document = ShipmentDocument.create({
      ...input,
      shipmentId: input.shipmentId.toUpperCase(),
      shipperId: input.shipperId.toUpperCase(),
    });
    expect(document.shipmentId).toBe(input.shipmentId);
    expect(document.shipperId).toBe(input.shipperId);
  });

  it('substitui o arquivo com outro identificador e preserva a versão anterior', () => {
    const document = ShipmentDocument.create(createShipmentDocumentData());
    const original = document.attachments[0];
    document.revise({
      attachments: [
        createAttachmentData({
          fileReference: 'documents/new.pdf',
          replacesAttachmentId: original.id,
        }),
      ],
    });
    const [old, replacement] = document.attachments;
    expect(old).toMatchObject({
      id: original.id,
      fileReference: original.fileReference,
    });
    expect(old.removedAt?.getTime()).toBeGreaterThanOrEqual(
      original.updatedAt.getTime(),
    );
    expect(replacement.id).not.toBe(original.id);
    expect(replacement).toMatchObject({
      replacesAttachmentId: original.id,
      removedAt: null,
    });
  });

  it('permite retirar o último anexo da preparação sem apagar seu histórico', () => {
    const document = ShipmentDocument.create(createShipmentDocumentData());
    document.revise({ removeAttachmentIds: [document.attachments[0].id] });
    expect(document.attachments).toHaveLength(1);
    expect(Number.isFinite(document.attachments[0].removedAt?.getTime())).toBe(
      true,
    );
  });

  it('rejeita mudanças em anexos alheios ou já retirados de uso', () => {
    const document = ShipmentDocument.create(createShipmentDocumentData());
    expect(() =>
      document.revise({ removeAttachmentIds: [randomUUID()] }),
    ).toThrow(ConflictError);
    const id = document.attachments[0].id;
    document.revise({ removeAttachmentIds: [id] });
    expect(() =>
      document.revise({
        attachments: [createAttachmentData({ replacesAttachmentId: id })],
      }),
    ).toThrow(ConflictError);
  });

  it('rejeita remoção e substituição do mesmo anexo na mesma alteração', () => {
    const document = ShipmentDocument.create(createShipmentDocumentData());
    const id = document.attachments[0].id;
    expect(() =>
      document.revise({
        removeAttachmentIds: [id],
        attachments: [createAttachmentData({ replacesAttachmentId: id })],
      }),
    ).toThrow(ConflictError);
  });

  it('mantém todo o agregado intacto quando a última inclusão é inválida', () => {
    const document = ShipmentDocument.create(createShipmentDocumentData());
    const before = document.toObject();
    expect(() =>
      document.revise({
        removeAttachmentIds: [document.attachments[0].id],
        attachments: [
          createAttachmentData(),
          createAttachmentData({ name: ' ' }),
        ],
      }),
    ).toThrow(BusinessRuleError);
    expect(document.toObject()).toEqual(before);
  });

  it('não permite alteração por meio de referências retornadas ou recebidas', () => {
    const data = createShipmentDocumentData();
    const document = ShipmentDocument.create(data);
    data.attachments![0].scopes[0].type = 'SHIPMENT_ITEM' as const;
    document.attachments[0].scopes[0].type = 'SHIPMENT_ITEM' as const;
    document.toObject().attachments[0].issuedAt.setUTCFullYear(1900);
    document.createdAt.setUTCFullYear(1900);
    expect(document.attachments[0].scopes[0].type).toBe('SHIPMENT' as const);
    expect(document.attachments[0].issuedAt.getUTCFullYear()).toBe(2026);
    expect(document.createdAt.getUTCFullYear()).not.toBe(1900);
  });

  it.each([
    ShipmentDocumentStatus.UNDER_REVIEW,
    ShipmentDocumentStatus.COMPLIANT,
    ShipmentDocumentStatus.NON_COMPLIANT,
  ])('bloqueia a edição no estado %s', (status) => {
    const document = ShipmentDocument.restore({
      ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
      status,
    });
    expect(() =>
      document.revise({ attachments: [createAttachmentData()] }),
    ).toThrow(ConflictError);
    expect(() => document.ensureEditable()).toThrow(ConflictError);
  });

  it('mantém o bloqueio se houver data de envio mesmo com status pendente', () => {
    const document = ShipmentDocument.restore({
      ...ShipmentDocument.create(createShipmentDocumentData()).toObject(),
      submittedAt: new Date(),
    });
    expect(() => document.ensureEditable()).toThrow(ConflictError);
  });

  it('rejeita alterações vazias', () => {
    expect(() =>
      ShipmentDocument.create(createShipmentDocumentData()).revise({}),
    ).toThrow(BusinessRuleError);
  });
});

describe('ShipmentDocument — validação dos anexos', () => {
  it.each([
    { name: ' ' },
    { name: 'a'.repeat(181) },
    { fileReference: ' ' },
    { fileReference: 'a'.repeat(1025) },
    { type: 'INVALID' as DocumentType },
    { issuedAt: new Date('invalid') },
    { expiresAt: new Date('invalid') },
    { expiresAt: new Date('2025-01-01') },
    { scopes: [] },
    { scopes: [{ type: 'SHIPMENT' as const, shipmentItemId: randomUUID() }] },
    { scopes: [{ type: 'SHIPMENT_ITEM' as const }] },
    { scopes: [{ type: 'INVALID' as DocumentScope['type'] }] },
    {
      scopes: [{ type: 'SHIPMENT' as const }, { type: 'SHIPMENT' as const }],
    },
  ])('rejeita os dados inválidos do anexo: %j', (overrides) => {
    expect(() =>
      ShipmentDocument.create(
        createShipmentDocumentData({
          attachments: [createAttachmentData(overrides)],
        }),
      ),
    ).toThrow(BusinessRuleError);
  });

  it('permite vários escopos explícitos e normaliza nomes e referências', () => {
    const itemId = randomUUID();
    const attachment = ShipmentDocument.create(
      createShipmentDocumentData({
        attachments: [
          createAttachmentData({
            name: ' Certificado ',
            fileReference: ' documents/file.pdf ',
            expiresAt: null,
            scopes: [
              { type: 'SHIPMENT' as const },
              {
                type: 'SHIPMENT_ITEM' as const,
                shipmentItemId: itemId.toUpperCase(),
              },
            ],
          }),
        ],
      }),
    ).attachments[0];
    expect(attachment).toMatchObject({
      name: 'Certificado',
      fileReference: 'documents/file.pdf',
      expiresAt: null,
    });
    expect(attachment.scopes[1].shipmentItemId).toBe(itemId);
  });
});
