import type { DocumentScope } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { randomUUID } from 'node:crypto';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';
import {
  BusinessRuleError,
  ConflictError,
} from '@/shared/domain/errors/domain.error.js';
import {
  createAttachmentData,
  createCargoDocumentData,
} from '../../mocks/cargo-document.fixture.js';

describe('CargoDocument', () => {
  it('inicia em preparação e permite não possuir anexos antes do envio', () => {
    const document = CargoDocument.create(
      createCargoDocumentData({ attachments: [] }),
    );
    expect(document.status).toBe(CargoDocumentStatus.PENDING);
    expect(document.submittedAt).toBeNull();
    expect(document.attachments).toEqual([]);
    expect(document.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    { cargoId: '' },
    { shipperId: 'inválido' },
    { compositionVersion: 0 },
    { compositionVersion: 1.5 },
    { compositionVersion: 2147483648 },
  ])('rejeita cadastro inválido: %j', (overrides) => {
    expect(() =>
      CargoDocument.create(createCargoDocumentData(overrides)),
    ).toThrow(BusinessRuleError);
  });

  it('normaliza os identificadores para evitar duplicação por caixa', () => {
    const input = createCargoDocumentData();
    const document = CargoDocument.create({
      ...input,
      cargoId: input.cargoId.toUpperCase(),
      shipperId: input.shipperId.toUpperCase(),
    });
    expect(document.cargoId).toBe(input.cargoId);
    expect(document.shipperId).toBe(input.shipperId);
  });

  it('substitui o arquivo com outro identificador e preserva a versão anterior', () => {
    const document = CargoDocument.create(createCargoDocumentData());
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
    const document = CargoDocument.create(createCargoDocumentData());
    document.revise({ removeAttachmentIds: [document.attachments[0].id] });
    expect(document.attachments).toHaveLength(1);
    expect(Number.isFinite(document.attachments[0].removedAt?.getTime())).toBe(
      true,
    );
  });

  it('rejeita mudanças em anexos alheios ou já retirados de uso', () => {
    const document = CargoDocument.create(createCargoDocumentData());
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
    const document = CargoDocument.create(createCargoDocumentData());
    const id = document.attachments[0].id;
    expect(() =>
      document.revise({
        removeAttachmentIds: [id],
        attachments: [createAttachmentData({ replacesAttachmentId: id })],
      }),
    ).toThrow(ConflictError);
  });

  it('mantém todo o agregado intacto quando a última inclusão é inválida', () => {
    const document = CargoDocument.create(createCargoDocumentData());
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
    const data = createCargoDocumentData();
    const document = CargoDocument.create(data);
    data.attachments![0].scopes[0].type = 'CARGO_ITEM' as const;
    document.attachments[0].scopes[0].type = 'CARGO_ITEM' as const;
    document.toObject().attachments[0].issuedAt.setUTCFullYear(1900);
    document.createdAt.setUTCFullYear(1900);
    expect(document.attachments[0].scopes[0].type).toBe('CARGO' as const);
    expect(document.attachments[0].issuedAt.getUTCFullYear()).toBe(2026);
    expect(document.createdAt.getUTCFullYear()).not.toBe(1900);
  });

  it.each([
    CargoDocumentStatus.UNDER_REVIEW,
    CargoDocumentStatus.COMPLIANT,
    CargoDocumentStatus.NON_COMPLIANT,
  ])('bloqueia a edição no estado %s', (status) => {
    const document = CargoDocument.restore({
      ...CargoDocument.create(createCargoDocumentData()).toObject(),
      status,
    });
    expect(() =>
      document.revise({ attachments: [createAttachmentData()] }),
    ).toThrow(ConflictError);
    expect(() => document.ensureEditable()).toThrow(ConflictError);
  });

  it('mantém o bloqueio se houver data de envio mesmo com status pendente', () => {
    const document = CargoDocument.restore({
      ...CargoDocument.create(createCargoDocumentData()).toObject(),
      submittedAt: new Date(),
    });
    expect(() => document.ensureEditable()).toThrow(ConflictError);
  });

  it('rejeita alterações vazias', () => {
    expect(() =>
      CargoDocument.create(createCargoDocumentData()).revise({}),
    ).toThrow(BusinessRuleError);
  });
});

describe('CargoDocument — validação dos anexos', () => {
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
    { scopes: [{ type: 'CARGO' as const, cargoItemId: randomUUID() }] },
    { scopes: [{ type: 'CARGO_ITEM' as const }] },
    { scopes: [{ type: 'INVALID' as DocumentScope['type'] }] },
    {
      scopes: [{ type: 'CARGO' as const }, { type: 'CARGO' as const }],
    },
  ])('rejeita os dados inválidos do anexo: %j', (overrides) => {
    expect(() =>
      CargoDocument.create(
        createCargoDocumentData({
          attachments: [createAttachmentData(overrides)],
        }),
      ),
    ).toThrow(BusinessRuleError);
  });

  it('permite vários escopos explícitos e normaliza nomes e referências', () => {
    const itemId = randomUUID();
    const attachment = CargoDocument.create(
      createCargoDocumentData({
        attachments: [
          createAttachmentData({
            name: ' Certificado ',
            fileReference: ' documents/file.pdf ',
            expiresAt: null,
            scopes: [
              { type: 'CARGO' as const },
              {
                type: 'CARGO_ITEM' as const,
                cargoItemId: itemId.toUpperCase(),
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
    expect(attachment.scopes[1].cargoItemId).toBe(itemId);
  });
});
