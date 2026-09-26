import { ApiProperty } from "@nestjs/swagger";
import { ChemicalShipmentResponseDto } from "./chemical-shipment-response.dto.ts";
import { ChemicalShipmentPage } from "../../domain/repositories/chemical-shipment.repository.ts";

export class ChemicalShipmentPageResponseDto {
    @ApiProperty({ type: [ChemicalShipmentResponseDto] })
    items: ChemicalShipmentResponseDto[];

    @ApiProperty({ type: Number, example: 10 })
    total: number;

    @ApiProperty({ type: Number, example: 1 })
    page: number;

    @ApiProperty({ type: Number, example: 10 })
    pageSize: number;

    private constructor(data: ChemicalShipmentPageResponseDto) {
        Object.assign(this, data)
    }

    static fromPage(page: ChemicalShipmentPage): ChemicalShipmentPageResponseDto {
        return new ChemicalShipmentPageResponseDto({
            items: page.items.map((chemicalShipment) => ChemicalShipmentResponseDto.fromEntity(chemicalShipment)),
            total: page.total,
            page: page.page,
            pageSize: page.pageSize,
        })
    }

}