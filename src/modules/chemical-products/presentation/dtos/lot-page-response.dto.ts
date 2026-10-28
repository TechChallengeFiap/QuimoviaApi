import { ApiProperty } from '@nestjs/swagger';
import { LotPage } from '@/modules/chemical-products/domain/repositories/lot.repository.js';
import { LotResponseDto } from './lot-response.dto.js';

export class LotPageResponseDto {
  @ApiProperty({ type: [LotResponseDto] })
  items: LotResponseDto[];

  @ApiProperty({ type: Number, example: 3 })
  total: number;

  @ApiProperty({ type: Number, example: 1 })
  page: number;

  @ApiProperty({ type: Number, example: 20 })
  pageSize: number;

  private constructor(data: LotPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(page: LotPage): LotPageResponseDto {
    return new LotPageResponseDto({
      items: page.items.map((lot) => LotResponseDto.fromEntity(lot)),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
