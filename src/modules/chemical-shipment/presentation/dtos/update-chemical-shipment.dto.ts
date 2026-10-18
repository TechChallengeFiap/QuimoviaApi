import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';
import { CreateChemicalShipmentDTO } from './create-chemical-shipment.dto.js';
import { StatusShipment } from '../../domain/value-objects/chemical-shipment/status-shipment.vo.js';

export class UpdateChemicalShipmentDto extends PartialType(
  CreateChemicalShipmentDTO,
) {
  @ApiPropertyOptional({
    type: String,
    enum: StatusShipment,
    example: StatusShipment.INSPECTION,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(StatusShipment, {
    message: 'O status da carga química é inválido.',
  })
  status?: StatusShipment;
}
