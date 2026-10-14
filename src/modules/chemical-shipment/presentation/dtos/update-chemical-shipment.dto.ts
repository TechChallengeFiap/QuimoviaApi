import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateChemicalShipmentDTO } from '@/modules/chemical-shipment/presentation/dtos/create-chemical-shipment.dto.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/enums/status-shipment.enum.js';

export class UpdateChemicalShipmentDto extends PartialType(
  CreateChemicalShipmentDTO,
) {
  @ApiPropertyOptional({
    enum: StatusShipment,
    enumName: 'StatusShipment',
    description: 'Nova situação da carga química',
    example: StatusShipment.INSPECTION,
  })
  @IsOptional()
  @IsEnum(StatusShipment)
  status?: StatusShipment;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  declare productId?: string;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  declare responsibleUserId?: string;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  declare documentsIds?: string;
}
