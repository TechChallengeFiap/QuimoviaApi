import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';

interface ChemicalShipmentResponseDtoData {
  id: string;
  code: string;
  productId: string;
  quantityProduct: number;
  unit: string;
  origin: string;
  destination: string;
  entryDate: Date;
  status: StatusShipment;
  responsibleUserId: string;
  responsibleUser?: UserResponseDto | null;
  documentsIds: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ChemicalShipmentResponseDto {
  @ApiProperty({
    type: String,
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Código identificador único da carga química',
    example: 'CARGO-2026-001',
  })
  code: string;

  @ApiProperty({ type: String, example: 'prod-001' })
  productId: string;

  @ApiProperty({ type: Number, example: 100 })
  quantityProduct: number;

  @ApiProperty({
    type: String,
    description: 'Unidade de medida da carga',
    example: 'toneladas',
  })
  unit: string;

  @ApiProperty({
    type: String,
    description: 'Origem da carga / Porto de embarque',
    example: 'Porto de Santos - Terminal Químico',
  })
  origin: string;

  @ApiProperty({
    type: String,
    description: 'Destino da carga / Porto ou terminal de desembarque',
    example: 'Terminal Industrial Mauá',
  })
  destination: string;

  @ApiProperty({
    type: Date,
    description: 'Data e hora de entrada no terminal portuário',
    example: '2026-10-24T12:00:00.000Z',
  })
  entryDate: Date;

  @ApiProperty({ enum: StatusShipment, example: StatusShipment.ANALYZING })
  status: StatusShipment;

  @ApiProperty({ type: String, example: 'user-001' })
  responsibleUserId: string;

  @ApiPropertyOptional({
    type: () => UserResponseDto,
    nullable: true,
    description: 'Dados do usuário responsável pela carga química',
  })
  responsibleUser?: UserResponseDto | null;

  @ApiProperty({ type: String, example: 'doc-001' })
  documentsIds: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ nullable: true, type: Date })
  deletedAt: Date | null;

  private constructor(data: ChemicalShipmentResponseDtoData) {
    Object.assign(this, data);
  }

  static fromEntity(shipment: ChemicalShipment): ChemicalShipmentResponseDto {
    return new ChemicalShipmentResponseDto({
      id: shipment.id,
      code: shipment.code,
      productId: shipment.productId,
      quantityProduct: shipment.quantityProduct,
      unit: shipment.unit,
      origin: shipment.origin,
      destination: shipment.destination,
      entryDate: shipment.entryDate,
      status: shipment.status,
      responsibleUserId: shipment.responsibleUserId,
      responsibleUser: shipment.responsibleUser
        ? UserResponseDto.fromEntity(shipment.responsibleUser)
        : null,
      documentsIds: shipment.documentsIds,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      deletedAt: shipment.deletedAt,
    });
  }
}
