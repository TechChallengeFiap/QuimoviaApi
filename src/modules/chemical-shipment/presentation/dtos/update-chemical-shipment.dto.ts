import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateChemicalShipmentDTO } from './create-chemical-shipment.dto.ts';
import { StatusShipment } from '../../domain/value-objects/chemical-shipment/status-shipment.vo.ts';

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
}
