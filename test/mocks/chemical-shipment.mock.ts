import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts';
import type {
  ChemicalShipmentPage,
  ChemicalShipmentRepository,
  ChemicalShipmentSearchFilters,
} from '@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts';

export class ChemicalShipmentMock implements ChemicalShipmentRepository {
  private readonly chemicalShipments = new Map<string, ChemicalShipment>();

  async create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    this.chemicalShipments.set(chemicalShipment.id, chemicalShipment);
    return chemicalShipment;
  }

  async findById(id: string): Promise<ChemicalShipment | null> {
    return this.chemicalShipments.get(id) ?? null;
  }

  async list(
    filters: ChemicalShipmentSearchFilters,
  ): Promise<ChemicalShipmentPage> {
    let items = Array.from(this.chemicalShipments.values());

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

  async update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
    this.chemicalShipments.set(chemicalShipment.id, chemicalShipment);
    return chemicalShipment;
  }

  async delete(id: string): Promise<void> {
    this.chemicalShipments.delete(id);
  }
}
