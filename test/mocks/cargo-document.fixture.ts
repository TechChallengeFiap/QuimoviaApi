import { randomUUID } from 'node:crypto';
import type {
  CreateCargoDocumentData,
  CreateDocumentAttachmentData,
} from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';

export const SHIPPER_ID = 'c4c68724-2ba9-4f4f-b38d-e8b7131eeae7';

export function createAttachmentData(
  overrides: Partial<CreateDocumentAttachmentData> = {},
): CreateDocumentAttachmentData {
  return {
    name: 'Ficha de segurança',
    type: DocumentType.SAFETY_DATA_SHEET,
    fileReference: 'documents/safety-sheet.pdf',
    scopes: [{ type: 'CARGO' }],
    issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createCargoDocumentData(
  overrides: Partial<CreateCargoDocumentData> = {},
): CreateCargoDocumentData {
  return {
    cargoId: randomUUID(),
    shipperId: SHIPPER_ID,
    compositionVersion: 1,
    attachments: [createAttachmentData()],
    ...overrides,
  };
}
