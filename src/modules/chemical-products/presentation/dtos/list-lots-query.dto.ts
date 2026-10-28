import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LotStatus } from '@/modules/chemical-products/domain/enums/lot-status.enum.js';

export class ListLotsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra os lotes pelo status atual',
    enum: LotStatus,
    enumName: 'LotStatus',
    example: LotStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @ApiPropertyOptional({
    description: 'Número da página desejada',
    type: Number,
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
    description: 'Quantidade de registros por página (máximo 100)',
    type: Number,
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
