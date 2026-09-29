import { CargoDocument } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import type { CargoDocumentProperties } from '@/modules/document-compliance/domain/entities/cargo-document.entity.js';
import type {
  CargoDocumentPage,
  CargoDocumentRepository,
  CargoDocumentSearchFilters,
} from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

/** Repositório em memória com cópias independentes, como as leituras do banco. */
export class CargoDocumentRepositoryMock implements CargoDocumentRepository {
  private readonly documents = new Map<string, CargoDocumentProperties>();

  async create(document: CargoDocument): Promise<CargoDocument> {
    if (await this.findByCargoId(document.cargoId)) {
      throw new ConflictError(
        'Já existe documentação cadastrada para esta carga.',
      );
    }
    this.documents.set(document.id, document.toObject());
    return CargoDocument.restore(document.toObject());
  }

  async update(document: CargoDocument): Promise<CargoDocument> {
    this.ensureWritable(document.id, document.revision);
    const properties = {
      ...document.toObject(),
      revision: document.revision + 1,
    };
    this.documents.set(document.id, properties);
    return CargoDocument.restore(properties);
  }

  async remove(id: string, revision: number): Promise<void> {
    this.ensureWritable(id, revision);
    this.documents.delete(id);
  }

  async findById(id: string): Promise<CargoDocument | null> {
    const document = this.documents.get(id);
    return document ? CargoDocument.restore(document) : null;
  }

  async findByCargoId(cargoId: string): Promise<CargoDocument | null> {
    const document = [...this.documents.values()].find(
      (item) => item.cargoId === cargoId,
    );
    return document ? CargoDocument.restore(document) : null;
  }

  async list(filters: CargoDocumentSearchFilters): Promise<CargoDocumentPage> {
    const items = [...this.documents.values()]
      .filter(
        (document) =>
          (!filters.cargoId || filters.cargoId === document.cargoId) &&
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
        .map(CargoDocument.restore),
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
    CargoDocument.restore(current).ensureEditable();
    if (current.revision !== revision) {
      throw new ConflictError(
        'A documentação foi alterada durante a operação.',
      );
    }
  }
}
