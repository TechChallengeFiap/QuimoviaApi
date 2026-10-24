import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client.js';
import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type {
  DocumentAttachmentProperties,
  DocumentScope,
} from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';
import type {
  ShipmentDocumentPage,
  ShipmentDocumentRepository,
  ShipmentDocumentSearchFilters,
} from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

const includeRelations = {
  attachments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  responsibleUser: { select: { id: true, name: true } },
} satisfies Prisma.ShipmentDocumentInclude;

type PersistedShipmentDocument = Prisma.ShipmentDocumentGetPayload<{
  include: typeof includeRelations;
}>;

@Injectable()
export class PrismaShipmentDocumentRepository implements ShipmentDocumentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(document: ShipmentDocument): Promise<ShipmentDocument> {
    try {
      const record = await this.prisma.shipmentDocument.create({
        data: {
          id: document.id,
          shipmentId: document.shipmentId,
          shipperId: document.shipperId,
          responsibleUserId: document.responsibleUserId,
          compositionVersion: document.compositionVersion,
          attachments: {
            create: document.attachments.map((attachment) =>
              PrismaShipmentDocumentRepository.attachmentData(attachment),
            ),
          },
        },
        include: includeRelations,
      });
      return PrismaShipmentDocumentRepository.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          'Já existe documentação cadastrada para esta carga.',
        );
      }
      return this.rethrowWriteError(
        error,
        document.id,
        document.responsibleUserId,
      );
    }
  }

  async update(document: ShipmentDocument): Promise<ShipmentDocument> {
    try {
      // A revisão impede que uma gravação sobrescreva alterações concorrentes.
      const record = await this.prisma.shipmentDocument.update({
        where: {
          id: document.id,
          revision: document.revision,
          status: ShipmentDocumentStatus.PENDING,
          submittedAt: null,
        },
        data: {
          revision: { increment: 1 },
          responsibleUserId: document.responsibleUserId,
          attachments: {
            upsert: document.attachments.map((attachment) => ({
              where: { id: attachment.id },
              create:
                PrismaShipmentDocumentRepository.attachmentData(attachment),
              update: {
                removedAt: attachment.removedAt,
                updatedAt: attachment.updatedAt,
              },
            })),
          },
        },
        include: includeRelations,
      });
      return PrismaShipmentDocumentRepository.toDomain(record);
    } catch (error) {
      return this.rethrowWriteError(
        error,
        document.id,
        document.responsibleUserId,
      );
    }
  }

  async remove(id: string, revision: number): Promise<void> {
    try {
      await this.prisma.shipmentDocument.delete({
        where: {
          id,
          revision,
          status: ShipmentDocumentStatus.PENDING,
          submittedAt: null,
        },
      });
    } catch (error) {
      await this.rethrowWriteError(error, id);
    }
  }

  async findById(id: string): Promise<ShipmentDocument | null> {
    const record = await this.prisma.shipmentDocument.findUnique({
      where: { id },
      include: includeRelations,
    });
    return record ? PrismaShipmentDocumentRepository.toDomain(record) : null;
  }

  async findByShipmentId(shipmentId: string): Promise<ShipmentDocument | null> {
    const record = await this.prisma.shipmentDocument.findUnique({
      where: { shipmentId },
      include: includeRelations,
    });
    return record ? PrismaShipmentDocumentRepository.toDomain(record) : null;
  }

  async list(
    filters: ShipmentDocumentSearchFilters,
  ): Promise<ShipmentDocumentPage> {
    const where = {
      ...(filters.shipmentId ? { shipmentId: filters.shipmentId } : {}),
      ...(filters.shipperId ? { shipperId: filters.shipperId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.shipmentDocument.findMany({
        where,
        include: includeRelations,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.shipmentDocument.count({ where }),
    ]);
    return {
      items: records.map((record) =>
        PrismaShipmentDocumentRepository.toDomain(record),
      ),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private async rethrowWriteError(
    error: unknown,
    id: string,
    responsibleUserId?: string | null,
  ): Promise<never> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003' &&
      responsibleUserId
    ) {
      throw new ResourceNotFoundError('Responsável técnico', responsibleUserId);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      const record = await this.prisma.shipmentDocument.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!record) {
        throw new ResourceNotFoundError('Documentação da carga', id);
      }
      throw new ConflictError(
        'A documentação foi alterada ou enviada para análise. Consulte os dados novamente.',
      );
    }
    throw error;
  }

  private static attachmentData(attachment: DocumentAttachmentProperties) {
    return {
      ...attachment,
      // Mantém o formato físico dos registros JSON anteriores à padronização.
      scopes: attachment.scopes.map((scope) => ({
        type: scope.type === 'SHIPMENT' ? 'CARGO' : 'CARGO_ITEM',
        ...(scope.shipmentItemId ? { cargoItemId: scope.shipmentItemId } : {}),
      })),
    };
  }

  private static toDomain(record: PersistedShipmentDocument): ShipmentDocument {
    return ShipmentDocument.restore({
      ...record,
      responsibleUser: record.responsibleUser
        ? { id: record.responsibleUser.id, name: record.responsibleUser.name }
        : null,
      status: record.status as ShipmentDocumentStatus,
      attachments: record.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type as DocumentType,
        fileReference: attachment.fileReference,
        // O formato JSON é validado pelo agregado antes de cada gravação.
        scopes: (
          attachment.scopes as unknown as {
            type: 'CARGO' | 'CARGO_ITEM';
            cargoItemId?: string;
          }[]
        ).map((scope): DocumentScope => ({
          type: scope.type === 'CARGO' ? 'SHIPMENT' : 'SHIPMENT_ITEM',
          ...(scope.cargoItemId ? { shipmentItemId: scope.cargoItemId } : {}),
        })),
        issuedAt: attachment.issuedAt,
        expiresAt: attachment.expiresAt,
        replacesAttachmentId: attachment.replacesAttachmentId,
        removedAt: attachment.removedAt,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      })),
    });
  }
}
