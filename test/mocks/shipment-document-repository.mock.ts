import { ShipmentDocument } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type { ShipmentDocumentProperties } from '@/modules/document-compliance/domain/entities/shipment-document.entity.js';
import type {
  ShipmentDocumentPage,
  ShipmentDocumentRepository,
  ShipmentDocumentSearchFilters,
} from '@/modules/document-compliance/domain/repositories/shipment-document.repository.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

/** Repositório em memória com cópias independentes, como as leituras do banco. */
export class ShipmentDocumentRepositoryMock implements ShipmentDocumentRepository {
  private readonly documents = new Map<string, ShipmentDocumentProperties>();

  async create(document: ShipmentDocument): Promise<ShipmentDocument> {
    if (await this.findByShipmentId(document.shipmentId)) {
      throw new ConflictError(
        'Já existe documentação cadastrada para esta carga.',
      );
    }
    this.documents.set(document.id, document.toObject());
    return ShipmentDocument.restore(document.toObject());
  }

  async update(document: ShipmentDocument): Promise<ShipmentDocument> {
    this.ensureWritable(document.id, document.revision);
    const properties = {
      ...document.toObject(),
      revision: document.revision + 1,
    };
    this.documents.set(document.id, properties);
    return ShipmentDocument.restore(properties);
  }

  async remove(id: string, revision: number): Promise<void> {
    this.ensureWritable(id, revision);
    this.documents.delete(id);
  }

  async findById(id: string): Promise<ShipmentDocument | null> {
    const document = this.documents.get(id);
    return document ? ShipmentDocument.restore(document) : null;
  }

  async findByShipmentId(shipmentId: string): Promise<ShipmentDocument | null> {
    const document = [...this.documents.values()].find(
      (item) => item.shipmentId === shipmentId,
    );
    return document ? ShipmentDocument.restore(document) : null;
  }

  async list(
    filters: ShipmentDocumentSearchFilters,
  ): Promise<ShipmentDocumentPage> {
    const items = [...this.documents.values()]
      .filter(
        (document) =>
          (!filters.shipmentId || filters.shipmentId === document.shipmentId) &&
          (!filters.shipperId || filters.shipperId === document.shipperId) &&
          (!filters.status || filters.status === document.status),
      )
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() ||
          right.id.localeCompare(left.id),
      );
    const start = (filters.page - 1) * filters.pageSize;
    return {
      items: items
        .slice(start, start + filters.pageSize)
        .map((document) => ShipmentDocument.restore(document)),
      total: items.length,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private ensureWritable(id: string, revision: number): void {
    const current = this.documents.get(id);
    if (!current) {
      throw new ResourceNotFoundError('Documentação da carga', id);
    }
    ShipmentDocument.restore(current).ensureEditable();
    if (current.revision !== revision) {
      throw new ConflictError(
        'A documentação foi alterada durante a operação.',
      );
    }
  }
}
