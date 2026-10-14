import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { InspectionStatus } from '@/modules/inspection/domain/enums/inspection-status.enum.js';

export class ListInspectionsQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filtra as inspeções de uma carga',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filtra as inspeções de um Fiscal',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiPropertyOptional({
    enum: InspectionStatus,
    enumName: 'InspectionStatus',
    description: 'Filtra as inspeções pela situação atual',
    example: InspectionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional({
    type: Number,
    description: 'Número da página desejada',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Quantidade de inspeções por página (máximo 100)',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
