import { ApiProperty } from '@nestjs/swagger';
import { ChemicalProductPage } from '@/modules/produtos-quimicos/domain/repositories/chemical-product.repository.js';
import { ChemicalProductResponseDto } from './chemical-product-response.dto.js';

export class ChemicalProductPageResponseDto {
  @ApiProperty({ type: [ChemicalProductResponseDto] })
  items: ChemicalProductResponseDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;

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
