import { ChemicalShipment } from '../domain/entities/chemical-shipment/chemical-shipment.entity.ts';

export interface ChemicalShipmentRepository {
  create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment>;
}

export const CHEMICAL_SHIPMENT_REPOSITORY = Symbol('ChemicalShipmentRepository');