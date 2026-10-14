import { ApiProperty } from '@nestjs/swagger';
import { Inspection } from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';
import { InspectionItemResponseDto } from './inspection-item-response.dto.js';

/** Representação de uma inspeção exposta pela API. */
export class InspectionResponseDto {
  @ApiProperty({
    type: String,
    description: 'Identificador da inspeção',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Identificador da carga inspecionada',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  shipmentId: string;

  @ApiProperty({
    type: Number,
    description: 'Versão da composição da carga avaliada',
    example: 1,
  })
  compositionVersion: number;

  @ApiProperty({
    enum: InspectionScope,
    enumName: 'InspectionScope',
    description: 'Escopo avaliado: a carga inteira ou um item da carga',
    example: InspectionScope.SHIPMENT,
  })
  scope: InspectionScope;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Item da carga avaliado; nulo na inspeção da carga inteira',
    example: null,
  })
  shipmentItemId: string | null;

  @ApiProperty({
    type: String,
    description: 'Identificador do Fiscal responsável',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  inspectorId: string;

  @ApiProperty({
    enum: InspectionStatus,
    enumName: 'InspectionStatus',
    description: 'Situação atual da inspeção',
    example: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  @ApiProperty({
    type: [InspectionItemResponseDto],
    description: 'Verificações previstas e seus resultados',
  })
  items: InspectionItemResponseDto[];

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Data e hora do início; nulo enquanto pendente',
    example: '2026-09-30T13:00:00.000Z',
  })
  startedAt: Date | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Data e hora da conclusão; nulo enquanto não concluída',
    example: '2026-09-30T15:30:00.000Z',
  })
  completedAt: Date | null;

  @ApiProperty({
    type: Date,
    description: 'Data e hora do cadastro',
    example: '2026-09-30T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'Data e hora da última atualização',
    example: '2026-09-30T12:00:00.000Z',
  })
  updatedAt: Date;

  private constructor(data: InspectionResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(inspection: Inspection): InspectionResponseDto {
    return new InspectionResponseDto({
      id: inspection.id,
      shipmentId: inspection.shipmentId,
      compositionVersion: inspection.compositionVersion,
      scope: inspection.scope,
      shipmentItemId: inspection.shipmentItemId,
      inspectorId: inspection.inspectorId,
      status: inspection.status,
      items: inspection.items.map((item) =>
        InspectionItemResponseDto.fromValueObject(item),
      ),
      startedAt: inspection.startedAt,
      completedAt: inspection.completedAt,
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt,
    });
  }
}
