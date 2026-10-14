import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import type { Page } from '@/shared/domain/pagination.js';

export interface ChemicalShipmentSearchFilters {
  status?: StatusShipment;
  productId?: string;
  responsibleUserId?: string;
  documentsIds?: string;
  page: number;
  pageSize: number;
}

export interface ChemicalShipmentRepository {
  create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment>;
  list(filters: ChemicalShipmentSearchFilters): Promise<Page<ChemicalShipment>>;
  findById(id: string): Promise<ChemicalShipment | null>;
  update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment>;
  delete(id: string): Promise<void>;
}

export const CHEMICAL_SHIPMENT_REPOSITORY = Symbol(
  'ChemicalShipmentRepository',
);
