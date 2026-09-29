import { ApiProperty } from '@nestjs/swagger';
import type { CargoDocumentPage } from '@/modules/document-compliance/domain/repositories/cargo-document.repository.js';
import { CargoDocumentResponseDto } from './cargo-document-response.dto.js';

export class CargoDocumentPageResponseDto {
  @ApiProperty({
    type: [CargoDocumentResponseDto],
    description: 'Documentações da página.',
  })
  items: CargoDocumentResponseDto[];
  @ApiProperty({
    description: 'Total de documentações que atendem aos filtros.',
  })
  total: number;
  @ApiProperty({ description: 'Página atual.' }) page: number;
  @ApiProperty({ description: 'Quantidade de registros por página.' })
  pageSize: number;

  private constructor(data: CargoDocumentPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(page: CargoDocumentPage): CargoDocumentPageResponseDto {
    return new CargoDocumentPageResponseDto({
      ...page,
      items: page.items.map(CargoDocumentResponseDto.fromEntity),
    });
  }
}
