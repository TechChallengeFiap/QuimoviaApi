import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import type {
  ChemicalShipmentPage,
  ChemicalShipmentRepository,
  ChemicalShipmentSearchFilters,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.js';
import type { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import {
  ConflictError,
  ResourceNotFoundError,
} from '@/shared/domain/errors/domain.error.js';

export class ChemicalShipmentMock implements ChemicalShipmentRepository {
  private readonly chemicalShipments = new Map<string, ChemicalShipment>();
  private readonly persistedStatuses = new Map<string, StatusShipment>();

  async create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    this.chemicalShipments.set(chemicalShipment.id, chemicalShipment);
    this.persistedStatuses.set(chemicalShipment.id, chemicalShipment.status);
    return chemicalShipment;
  }

  async findById(id: string): Promise<ChemicalShipment | null> {
    return this.chemicalShipments.get(id) ?? null;
  }

  async list(
    filters: ChemicalShipmentSearchFilters,
  ): Promise<ChemicalShipmentPage> {
    let items = Array.from(this.chemicalShipments.values());

    if (filters.code) {
      items = items.filter((shipment) => shipment.code === filters.code);
    }

    if (filters.status) {
      items = items.filter((shipment) => shipment.status === filters.status);
    }

    if (filters.productId) {
      items = items.filter(
        (shipment) => shipment.productId === filters.productId,
      );
    }

    if (filters.responsibleUserId) {
      items = items.filter(
        (shipment) => shipment.responsibleUserId === filters.responsibleUserId,
      );
    }

    if (filters.documentsIds) {
      items = items.filter(
        (shipment) => shipment.documentsIds === filters.documentsIds,
      );
    }

    const total = items.length;
    const start = (filters.page - 1) * filters.pageSize;

    return {
      items: items.slice(start, start + filters.pageSize),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async update(
    chemicalShipment: ChemicalShipment,
    expectedPreviousStatus?: StatusShipment | StatusShipment[],
  ): Promise<ChemicalShipment> {
    const existing = this.chemicalShipments.get(chemicalShipment.id);
    if (!existing || existing.deletedAt) {
      throw new ResourceNotFoundError('Carga Química', chemicalShipment.id);
    }
    if (expectedPreviousStatus !== undefined) {
      const persisted =
        this.persistedStatuses.get(chemicalShipment.id) ?? existing.status;
      const allowed = Array.isArray(expectedPreviousStatus)
        ? expectedPreviousStatus
        : [expectedPreviousStatus];
      if (!allowed.includes(persisted)) {
        throw new ConflictError(
          `Conflito de concorrência ao atualizar a carga química "${chemicalShipment.id}": status esperado era "${allowed.join(', ')}", mas o status atual é "${persisted}".`,
        );
      }
    }
    this.chemicalShipments.set(chemicalShipment.id, chemicalShipment);
    this.persistedStatuses.set(chemicalShipment.id, chemicalShipment.status);
    return chemicalShipment;
  }

  async delete(id: string): Promise<void> {
    this.chemicalShipments.delete(id);
    this.persistedStatuses.delete(id);
  }
}
