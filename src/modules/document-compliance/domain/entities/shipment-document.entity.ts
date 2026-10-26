import { randomUUID } from 'node:crypto';
import {
  BusinessRuleError,
  ConflictError,
} from '@/shared/domain/errors/domain.error.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';

export interface DocumentScope {
  type: 'SHIPMENT' | 'SHIPMENT_ITEM';
  shipmentItemId?: string;
}

export interface CreateDocumentAttachmentData {
  name: string;
  type: DocumentType;
  fileReference: string;
  scopes: DocumentScope[];
  issuedAt: Date;
  expiresAt?: Date | null;
  replacesAttachmentId?: string;
}

export interface DocumentAttachmentProperties extends Omit<
  CreateDocumentAttachmentData,
  'expiresAt' | 'replacesAttachmentId'
> {
  id: string;
  expiresAt: Date | null;
  replacesAttachmentId: string | null;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentDocumentProperties {
  id: string;
  shipmentId: string;
  shipperId: string;
  responsibleUserId: string | null;
  compositionVersion: number;
  status: ShipmentDocumentStatus;
  submittedAt: Date | null;
  revision: number;
  attachments: DocumentAttachmentProperties[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentDocumentData {
  shipmentId: string;
  shipperId: string;
  responsibleUserId?: string;
  compositionVersion: number;
  attachments?: CreateDocumentAttachmentData[];
}

export interface UpdateShipmentDocumentData {
  responsibleUserId?: string;
  attachments?: CreateDocumentAttachmentData[];
  removeAttachmentIds?: string[];
}

const UUID_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Raiz da documentação; controla a validação e o histórico dos anexos. */
export class ShipmentDocument {
  private constructor(
    private readonly properties: ShipmentDocumentProperties,
  ) {}

  static create(data: CreateShipmentDocumentData): ShipmentDocument {
    if (
      !UUID_FORMAT.test(data.shipmentId) ||
      !UUID_FORMAT.test(data.shipperId)
    ) {
      throw new BusinessRuleError(
        'A carga e o embarcador devem possuir identificadores válidos.',
      );
    }
    if (
      !Number.isInteger(data.compositionVersion) ||
      data.compositionVersion < 1 ||
      data.compositionVersion > 2147483647
    ) {
      throw new BusinessRuleError(
        'A versão da composição deve ser um inteiro entre 1 e 2147483647.',
      );
    }
    const now = new Date();
    const document = new ShipmentDocument({
      id: randomUUID(),
      shipmentId: data.shipmentId.toLowerCase(),
      shipperId: data.shipperId.toLowerCase(),
      responsibleUserId: data.responsibleUserId?.toLowerCase() ?? null,
      compositionVersion: data.compositionVersion,
      status: ShipmentDocumentStatus.PENDING,
      submittedAt: null,
      revision: 0,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    });
    if (data.attachments?.length) {
      document.revise({ attachments: data.attachments });
    }
    return document;
  }

  static restore(properties: ShipmentDocumentProperties): ShipmentDocument {
    return new ShipmentDocument(structuredClone(properties));
  }

  get id(): string {
    return this.properties.id;
  }
  get shipmentId(): string {
    return this.properties.shipmentId;
  }
  get shipperId(): string {
    return this.properties.shipperId;
  }
  get responsibleUserId(): string | null {
    return this.properties.responsibleUserId;
  }
  get compositionVersion(): number {
    return this.properties.compositionVersion;
  }
  get status(): ShipmentDocumentStatus {
    return this.properties.status;
  }
  get submittedAt(): Date | null {
    return this.properties.submittedAt
      ? new Date(this.properties.submittedAt)
      : null;
  }
  get revision(): number {
    return this.properties.revision;
  }
  get attachments(): DocumentAttachmentProperties[] {
    return structuredClone(this.properties.attachments);
  }
  get createdAt(): Date {
    return new Date(this.properties.createdAt);
  }
  get updatedAt(): Date {
    return new Date(this.properties.updatedAt);
  }

  /** Confirma o responsável e os anexos juntos, após validar toda a alteração. */
  revise(data: UpdateShipmentDocumentData): void {
    this.ensureEditable();
    const additions = data.attachments ?? [];
    const removals = data.removeAttachmentIds ?? [];
    if (
      additions.length === 0 &&
      removals.length === 0 &&
      data.responsibleUserId === undefined
    ) {
      throw new BusinessRuleError(
        'Informe o responsável técnico ou ao menos um anexo para adicionar, substituir ou remover.',
      );
    }

    const changedIds = [
      ...removals,
      ...additions.flatMap((attachment) =>
        attachment.replacesAttachmentId
          ? [attachment.replacesAttachmentId]
          : [],
      ),
    ].map((id) => id.toLowerCase());
    const changed = new Set(changedIds);
    if (changed.size !== changedIds.length) {
      throw new ConflictError(
        'Um anexo não pode ser removido ou substituído mais de uma vez na mesma alteração.',
      );
    }
    const activeIds = new Set(
      this.properties.attachments
        .filter((attachment) => attachment.removedAt === null)
        .map((attachment) => attachment.id),
    );
    if (changedIds.some((id) => !activeIds.has(id))) {
      throw new ConflictError(
        'O anexo a remover ou substituir não está ativo nesta documentação.',
      );
    }

    const now = new Date();
    const created = additions.map((attachment) =>
      ShipmentDocument.createAttachment(attachment, now),
    );
    if (data.responsibleUserId !== undefined) {
      const responsibleUserId = data.responsibleUserId.toLowerCase();
      this.properties.responsibleUserId = responsibleUserId;
    }
    this.properties.attachments = [
      ...this.properties.attachments.map((attachment) =>
        changed.has(attachment.id)
          ? { ...attachment, removedAt: now, updatedAt: now }
          : attachment,
      ),
      ...created,
    ];
    this.properties.updatedAt = now;
  }

  ensureEditable(): void {
    if (
      this.status !== ShipmentDocumentStatus.PENDING ||
      this.submittedAt !== null
    ) {
      throw new ConflictError(
        'A documentação enviada para análise não pode ser alterada ou excluída pelo cadastro.',
      );
    }
  }

  toObject(): ShipmentDocumentProperties {
    return structuredClone(this.properties);
  }

  private static createAttachment(
    data: CreateDocumentAttachmentData,
    now: Date,
  ): DocumentAttachmentProperties {
    const name = data.name.trim();
    const fileReference = data.fileReference.trim();
    if (!name || name.length > 180) {
      throw new BusinessRuleError(
        'O nome do anexo deve ter entre 1 e 180 caracteres.',
      );
    }
    if (!fileReference || fileReference.length > 1024) {
      throw new BusinessRuleError(
        'A referência do arquivo deve ter entre 1 e 1024 caracteres.',
      );
    }
    if (!Object.values(DocumentType).includes(data.type)) {
      throw new BusinessRuleError('O tipo do documento é inválido.');
    }
    if (!Number.isFinite(data.issuedAt.getTime())) {
      throw new BusinessRuleError('A data de emissão é inválida.');
    }
    if (
      data.expiresAt &&
      (!Number.isFinite(data.expiresAt.getTime()) ||
        data.expiresAt < data.issuedAt)
    ) {
      throw new BusinessRuleError(
        'A validade deve ser uma data igual ou posterior à emissão.',
      );
    }
    ShipmentDocument.validateScopes(data.scopes);
    return structuredClone({
      id: randomUUID(),
      name,
      type: data.type,
      fileReference,
      scopes: data.scopes.map((scope) => ({
        type: scope.type,
        ...(scope.shipmentItemId
          ? { shipmentItemId: scope.shipmentItemId.toLowerCase() }
          : {}),
      })),
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt ?? null,
      replacesAttachmentId: data.replacesAttachmentId?.toLowerCase() ?? null,
      removedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  private static validateScopes(scopes: DocumentScope[]): void {
    if (scopes.length === 0) {
      throw new BusinessRuleError(
        'O anexo deve identificar pelo menos um escopo.',
      );
    }
    const keys = new Set<string>();
    for (const scope of scopes) {
      if (scope.type !== 'SHIPMENT' && scope.type !== 'SHIPMENT_ITEM') {
        throw new BusinessRuleError('O escopo do documento é inválido.');
      }
      if (scope.type === 'SHIPMENT' && scope.shipmentItemId !== undefined) {
        throw new BusinessRuleError(
          'O escopo da carga inteira não pode identificar um item.',
        );
      }
      if (
        scope.type === 'SHIPMENT_ITEM' &&
        !UUID_FORMAT.test(scope.shipmentItemId ?? '')
      ) {
        throw new BusinessRuleError(
          'O escopo de item exige um identificador de item válido.',
        );
      }
      const key = `${scope.type}:${scope.shipmentItemId?.toLowerCase() ?? ''}`;
      if (keys.has(key)) {
        throw new BusinessRuleError(
          'Os escopos de um anexo não podem se repetir.',
        );
      }
      keys.add(key);
    }
  }
}
