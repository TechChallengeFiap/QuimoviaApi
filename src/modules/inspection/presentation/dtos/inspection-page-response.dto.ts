import { ApiProperty } from '@nestjs/swagger';
import { InspectionPage } from '@/modules/inspection/domain/repositories/inspection.repository.js';
import { InspectionResponseDto } from './inspection-response.dto.js';

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

  static fromPage(page: InspectionPage): InspectionPageResponseDto {
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
