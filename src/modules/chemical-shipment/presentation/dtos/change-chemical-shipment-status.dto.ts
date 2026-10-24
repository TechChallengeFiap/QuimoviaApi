import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';

export class ChangeChemicalShipmentStatusDto {
  @ApiProperty({
    enum: StatusShipment,
    enumName: 'StatusShipment',
    example: StatusShipment.ANALYZING,
    description:
      'Novo status da carga. A transição precisa ser permitida pela máquina de estados.',
  })
  @IsEnum(StatusShipment, { message: 'O status da carga química é inválido.' })
  status!: StatusShipment;
}
