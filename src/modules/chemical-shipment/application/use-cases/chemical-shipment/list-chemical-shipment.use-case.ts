import { CHEMICAL_SHIPMENT_REPOSITORY } from "@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts";
import { StatusShipment } from "@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.ts";
import { Inject, Injectable } from "@nestjs/common";
import type { ChemicalShipmentPage, ChemicalShipmentRepository } from "@/modules/chemical-shipment/domain/repositories/chemical-shipment.repository.ts";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface ListChemicalShipmentInput {
    status?: StatusShipment;
    productId?: string;
    responsibleUserId?: string;
    documentsIds?: string;
    page?: number;
    pageSize?: number;
}

@Injectable()
export class ListChemicalShipmentUseCase {
    constructor(
        @Inject(CHEMICAL_SHIPMENT_REPOSITORY)
        private readonly chemicalShipments: ChemicalShipmentRepository,
    ){}

    async execute(input: ListChemicalShipmentInput = {}): Promise<ChemicalShipmentPage> {
        return this.chemicalShipments.list({
            status: input.status,
            productId: input.productId,
            responsibleUserId: input.responsibleUserId,
            documentsIds: input.documentsIds,
            page: input.page ? Number(input.page) : DEFAULT_PAGE,
            pageSize: input.pageSize ? Number(input.pageSize) : DEFAULT_PAGE_SIZE,
        })
    }
}