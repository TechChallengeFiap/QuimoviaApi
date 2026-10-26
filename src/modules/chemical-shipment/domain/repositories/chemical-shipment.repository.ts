import { ChemicalShipment } from '../entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '../value-objects/chemical-shipment/status-shipment.vo.js';

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
  update(
    chemicalShipment: ChemicalShipment,
    expectedPreviousStatus?: StatusShipment | StatusShipment[],
  ): Promise<ChemicalShipment>;
  delete(id: string): Promise<void>;
}

export const CHEMICAL_SHIPMENT_REPOSITORY = Symbol(
  'ChemicalShipmentRepository',
);
