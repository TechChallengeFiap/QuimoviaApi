import { ApiProperty } from '@nestjs/swagger';
import { ChemicalProductPage } from '@/modules/chemical-products/domain/repositories/chemical-product.repository.js';
import { ChemicalProductResponseDto } from './chemical-product-response.dto.js';

export class ChemicalProductPageResponseDto {
  @ApiProperty({ type: [ChemicalProductResponseDto] })
  items: ChemicalProductResponseDto[];

  @ApiProperty({ type: Number, example: 42 })
  total: number;

  @ApiProperty({ type: Number, example: 1 })
  page: number;

  @ApiProperty({ type: Number, example: 20 })
  pageSize: number;

  private constructor(data: ChemicalProductPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(page: ChemicalProductPage): ChemicalProductPageResponseDto {
    return new ChemicalProductPageResponseDto({
      items: page.items.map((product) => ChemicalProductResponseDto.fromEntity(product)),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
