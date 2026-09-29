import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client.js';
import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import type {
  DocumentAttachmentProperties,
  DocumentScope,
} from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';
import { DocumentType } from '@/modules/document-compliance/domain/enums/document-type.enum.js';
import type {
  CargoDocumentPage,
  CargoDocumentRepository,
  CargoDocumentSearchFilters,
} from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

const includeAttachments = {
  attachments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.CargoDocumentInclude;

type PersistedCargoDocument = Prisma.CargoDocumentGetPayload<{
  include: typeof includeAttachments;
}>;

@Injectable()
export class PrismaCargoDocumentRepository implements CargoDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: CargoDocument): Promise<CargoDocument> {
    try {
      const record = await this.prisma.cargoDocument.create({
        data: {
          id: document.id,
          cargoId: document.cargoId,
          shipperId: document.shipperId,
          compositionVersion: document.compositionVersion,
          attachments: {
            create: document.attachments.map(
              PrismaCargoDocumentRepository.attachmentData,
            ),
          },
        },
        include: includeAttachments,
      });
      return PrismaCargoDocumentRepository.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          'Já existe documentação cadastrada para esta carga.',
        );
      }
      throw error;
    }
  }

  async update(document: CargoDocument): Promise<CargoDocument> {
    try {
      // A revisão impede que uma gravação sobrescreva alterações concorrentes.
      const record = await this.prisma.cargoDocument.update({
        where: {
          id: document.id,
          revision: document.revision,
          status: CargoDocumentStatus.PENDING,
          submittedAt: null,
        },
        data: {
          revision: { increment: 1 },
          attachments: {
            upsert: document.attachments.map((attachment) => ({
              where: { id: attachment.id },
              create: PrismaCargoDocumentRepository.attachmentData(attachment),
              update: {
                removedAt: attachment.removedAt,
                updatedAt: attachment.updatedAt,
              },
            })),
          },
        },
        include: includeAttachments,
      });
      return PrismaCargoDocumentRepository.toDomain(record);
    } catch (error) {
      return this.rethrowWriteError(error, document.id);
    }
  }

  async remove(id: string, revision: number): Promise<void> {
    try {
      await this.prisma.cargoDocument.delete({
        where: {
          id,
          revision,
          status: CargoDocumentStatus.PENDING,
          submittedAt: null,
        },
      });
    } catch (error) {
      await this.rethrowWriteError(error, id);
    }
  }

  async findById(id: string): Promise<CargoDocument | null> {
    const record = await this.prisma.cargoDocument.findUnique({
      where: { id },
      include: includeAttachments,
    });
    return record ? PrismaCargoDocumentRepository.toDomain(record) : null;
  }

  async findByCargoId(cargoId: string): Promise<CargoDocument | null> {
    const record = await this.prisma.cargoDocument.findUnique({
      where: { cargoId },
      include: includeAttachments,
    });
    return record ? PrismaCargoDocumentRepository.toDomain(record) : null;
  }

  async list(filters: CargoDocumentSearchFilters): Promise<CargoDocumentPage> {
    const where = {
      ...(filters.cargoId ? { cargoId: filters.cargoId } : {}),
      ...(filters.shipperId ? { shipperId: filters.shipperId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.cargoDocument.findMany({
        where,
        include: includeAttachments,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.cargoDocument.count({ where }),
    ]);
    return {
      items: records.map(PrismaCargoDocumentRepository.toDomain),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private async rethrowWriteError(error: unknown, id: string): Promise<never> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      const record = await this.prisma.cargoDocument.findUnique({
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
      scopes: attachment.scopes.map((scope) => ({ ...scope })),
    };
  }

  private static toDomain(record: PersistedCargoDocument): CargoDocument {
    return CargoDocument.restore({
      ...record,
      status: record.status as CargoDocumentStatus,
      attachments: record.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type as DocumentType,
        fileReference: attachment.fileReference,
        // O formato JSON é validado pelo agregado antes de cada gravação.
        scopes: attachment.scopes as unknown as DocumentScope[],
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
