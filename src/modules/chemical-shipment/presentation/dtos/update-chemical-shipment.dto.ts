import { PartialType } from '@nestjs/swagger';
import { CreateChemicalShipmentDTO } from './create-chemical-shipment.dto.js';

export class UpdateChemicalShipmentDto extends PartialType(
  CreateChemicalShipmentDTO,
) {}
