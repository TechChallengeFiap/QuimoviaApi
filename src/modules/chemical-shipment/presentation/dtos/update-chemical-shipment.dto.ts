import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateChemicalShipmentDTO } from './create-chemical-shipment.dto.js';
import { StatusShipment } from '../../domain/value-objects/chemical-shipment/status-shipment.vo.js';

export class UpdateChemicalShipmentDto extends PartialType(
  CreateChemicalShipmentDTO,
) {
  @ApiProperty({
    required: false,
    type: () => StatusShipment,
  })
  declare status?: StatusShipment;

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

  @ApiProperty({
    required: false,
    type: () => Number,
  })
  declare quantityProduct?: number;
}
