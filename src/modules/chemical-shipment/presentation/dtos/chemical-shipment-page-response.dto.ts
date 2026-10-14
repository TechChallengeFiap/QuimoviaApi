import { ApiProperty } from '@nestjs/swagger';
import { ChemicalShipmentResponseDto } from '@/modules/chemical-shipment/presentation/dtos/chemical-shipment-response.dto.js';
import type { ChemicalShipmentDetails } from '@/modules/chemical-shipment/application/dto/chemical-shipment-details.dto.js';
import type { Page } from '@/shared/domain/pagination.js';

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
    Object.assign(this, data);
  }

  static fromPage(
    page: Page<ChemicalShipmentDetails>,
  ): ChemicalShipmentPageResponseDto {
    return new ChemicalShipmentPageResponseDto({
      items: page.items.map((details) =>
        ChemicalShipmentResponseDto.fromDetails(details),
      ),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
