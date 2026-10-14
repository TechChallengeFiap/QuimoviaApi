import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';
import { UserResponseDto } from '@/modules/user/presentation/dtos/user-response.dto.js';

interface ChemicalShipmentResponseDtoData {
  id: string;
  productId: string;
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

  @ApiProperty({ type: String, example: 'prod-001' })
  productId: string;

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
      productId: shipment.productId,
      status: shipment.status,
      responsibleUserId: shipment.responsibleUserId,
      responsibleUser: shipment.responsibleUser
        ? UserResponseDto.from(shipment.responsibleUser)
        : null,
      documentsIds: shipment.documentsIds,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      deletedAt: shipment.deletedAt,
    });
  }
}
