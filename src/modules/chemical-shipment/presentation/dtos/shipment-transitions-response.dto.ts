import { ApiProperty } from '@nestjs/swagger';
import {
  STATUS_SHIPMENT_LABELS,
  StatusShipment,
} from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { allowedTransitionsFrom } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/shipment-status-transitions.js';

export class StatusTransitionOptionDto {
  @ApiProperty({
    type: String,
    enum: StatusShipment,
    enumName: 'StatusShipment',
    example: StatusShipment.ANALYZING,
    description: 'Status para o qual a carga pode transicionar',
  })
  status!: StatusShipment;

  @ApiProperty({
    type: String,
    example: 'Em análise',
    description: 'Rótulo descritivo do status em português',
  })
  label!: string;
}

export class ShipmentTransitionsResponseDto {
  @ApiProperty({
    type: String,
    example: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
    description: 'Identificador único da carga química',
  })
  shipmentId!: string;

  @ApiProperty({
    type: String,
    enum: StatusShipment,
    enumName: 'StatusShipment',
    example: StatusShipment.REGISTERED,
    description: 'Status atual da carga química',
  })
  currentStatus!: StatusShipment;

  @ApiProperty({
    type: String,
    example: 'Registrada',
    description: 'Rótulo amigável do status atual em português',
  })
  currentStatusLabel!: string;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica se a carga está em um estado terminal (COMPLETED ou CANCELLED)',
  })
  isTerminal!: boolean;

  @ApiProperty({
    type: () => [StatusTransitionOptionDto],
    description: 'Lista de status para os quais a carga pode transicionar a partir do estado atual',
  })
  allowedTransitions!: StatusTransitionOptionDto[];

  static fromEntity(shipment: ChemicalShipment): ShipmentTransitionsResponseDto {
    const nextStatuses = allowedTransitionsFrom(shipment.status);
    return {
      shipmentId: shipment.id,
      currentStatus: shipment.status,
      currentStatusLabel: STATUS_SHIPMENT_LABELS[shipment.status],
      isTerminal: shipment.isTerminal,
      allowedTransitions: nextStatuses.map((s) => ({
        status: s,
        label: STATUS_SHIPMENT_LABELS[s],
      })),
    };
  }
}
