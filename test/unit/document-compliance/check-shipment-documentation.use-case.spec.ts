import { beforeEach, describe, expect, it } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { CheckShipmentDocumentationUseCase } from '@/modules/document-compliance/application/use-cases/shipment-documents/check-shipment-documentation.use-case.js';
import { ShipmentDocumentRepositoryMock } from '../../mocks/shipment-document-repository.mock.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import {
  createAttachmentData,
  createShipmentDocumentData,
} from '../../mocks/shipment-document.fixture.js';

describe('CheckShipmentDocumentationUseCase', () => {
  let repository: ShipmentDocumentRepositoryMock;
  let useCase: CheckShipmentDocumentationUseCase;

  beforeEach(() => {
    repository = new ShipmentDocumentRepositoryMock();
    useCase = new CheckShipmentDocumentationUseCase(repository);
  });

  it('retorna false quando a carga não possui documentação cadastrada', async () => {
    const hasDocs = await useCase.hasRequiredDocumentation(randomUUID());
    expect(hasDocs).toBe(false);
  });

  it('retorna false quando a documentação não possui anexos válidos para liberação', async () => {
    const shipmentId = randomUUID();
    const past = new Date(Date.now() - 86400000);
    const document = ShipmentDocument.create(
      createShipmentDocumentData({
        shipmentId,
        attachments: [createAttachmentData({ expiresAt: past })],
      }),
    );
    await repository.create(document);

    const hasDocs = await useCase.hasRequiredDocumentation(shipmentId);
    expect(hasDocs).toBe(false);
  });

  it('retorna true quando a documentação possui anexo ativo e vigente', async () => {
    const shipmentId = randomUUID();
    const document = ShipmentDocument.create(
      createShipmentDocumentData({
        shipmentId,
        attachments: [createAttachmentData({ expiresAt: null })],
      }),
    );
    await repository.create(document);

    const hasDocs = await useCase.hasRequiredDocumentation(shipmentId);
    expect(hasDocs).toBe(true);
  });
});
