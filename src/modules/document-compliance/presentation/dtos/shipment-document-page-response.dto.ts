import { ApiProperty } from '@nestjs/swagger';
import type { ShipmentDocumentDetailsPage } from '@/modules/document-compliance/application/dto/shipment-document-details.js';
import { ShipmentDocumentResponseDto } from './shipment-document-response.dto.js';

export class ShipmentDocumentPageResponseDto {
  @ApiProperty({
    type: [ShipmentDocumentResponseDto],
    description: 'Documentações da página.',
  })
  items: ShipmentDocumentResponseDto[];
  @ApiProperty({
    type: Number,
    description: 'Total de documentações que atendem aos filtros.',
  })
  total: number;
  @ApiProperty({ type: Number, description: 'Página atual.' }) page: number;
  @ApiProperty({
    type: Number,
    description: 'Quantidade de registros por página.',
  })
  pageSize: number;

  private constructor(data: ShipmentDocumentPageResponseDto) {
    Object.assign(this, data);
  }

  static fromPage(
    page: ShipmentDocumentDetailsPage,
  ): ShipmentDocumentPageResponseDto {
    return new ShipmentDocumentPageResponseDto({
      ...page,
      items: page.items.map((document) =>
        ShipmentDocumentResponseDto.fromDetails(document),
      ),
    });
  }
}
