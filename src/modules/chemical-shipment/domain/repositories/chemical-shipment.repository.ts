import { ChemicalShipment } from '../entities/chemical-shipment/chemical-shipment.entity.ts';
import { StatusShipment } from '../value-objects/chemical-shipment/status-shipment.vo.ts';

export interface ChemicalShipmentPage{
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
}

export const CHEMICAL_SHIPMENT_REPOSITORY = Symbol('ChemicalShipmentRepository');