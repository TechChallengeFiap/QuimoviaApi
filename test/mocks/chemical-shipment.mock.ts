import { ChemicalShipment } from "@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts";
import { ChemicalShipmentRepository } from "@/modules/chemical-shipment/repositories/chemical-shipment.repository.ts";

export class ChemicalShipmentMock implements ChemicalShipmentRepository {
    private readonly chemicalShipments = new Map<string, ChemicalShipment>

    async create(chemicalShipment: ChemicalShipment): Promise<ChemicalShipment> {
        this.chemicalShipments.set(chemicalShipment.id, chemicalShipment);
        return chemicalShipment;
    }

    async findById(id: string): Promise<ChemicalShipment | null> {
        return this.chemicalShipments.get(id) ?? null;
    }
}