import { ApiProperty } from '@nestjs/swagger';
import { InspectionResponseDto } from './inspection-response.dto.js';
import type { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import type { Page } from '@/shared/domain/pagination.js';

export class InspectionPageResponseDto {
  @ApiProperty({
    type: [InspectionResponseDto],
    description: 'Inspeções da página solicitada',
  })
  items: InspectionResponseDto[];

  @ApiProperty({
    type: Number,
    description: 'Total de inspeções que atendem aos filtros informados',
    example: 8,
  })
  total: number;

  @ApiProperty({
    type: Number,
    description: 'Número da página retornada',
    example: 1,
  })
  page: number;

  @ApiProperty({
    type: Number,
    description: 'Quantidade máxima de inspeções por página',
    example: 20,
  })
  pageSize: number;

  private constructor(data: InspectionPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(page: Page<Inspection>): InspectionPageResponseDto {
    return new InspectionPageResponseDto({
      items: page.items.map((inspection) =>
        InspectionResponseDto.fromEntity(inspection),
      ),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
