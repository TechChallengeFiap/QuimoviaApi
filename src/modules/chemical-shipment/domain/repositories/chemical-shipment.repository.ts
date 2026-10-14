import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';

export interface ChemicalShipmentPage {
  items: ChemicalShipment[];
  total: number;
  page: number;
  pageSize: number;
}

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
  list(filters: ChemicalShipmentSearchFilters): Promise<ChemicalShipmentPage>;
  findById(id: string): Promise<ChemicalShipment | null>;
  update(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment>;
  delete(id: string): Promise<void>;
}

export const CHEMICAL_SHIPMENT_REPOSITORY = Symbol(
  'ChemicalShipmentRepository',
);
