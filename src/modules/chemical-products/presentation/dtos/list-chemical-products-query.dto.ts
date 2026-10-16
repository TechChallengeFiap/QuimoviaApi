import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';

export class ListChemicalProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra os produtos químicos pela classe de risco',
    enum: ProductRiskClass,
    enumName: 'ProductRiskClass',
    example: ProductRiskClass.CORROSIVE_SUBSTANCES,
  })
  @IsOptional()
  @IsEnum(ProductRiskClass)
  riskClass?: ProductRiskClass;

  @ApiPropertyOptional({
    description: 'Filtra os produtos químicos pelo estado físico',
    enum: ProductPhysicalState,
    enumName: 'ProductPhysicalState',
    example: ProductPhysicalState.LIQUID,
  })
  @IsOptional()
  @IsEnum(ProductPhysicalState)
  physicalState?: ProductPhysicalState;

  @ApiPropertyOptional({
    description: 'Filtra os produtos químicos pelo status atual',
    enum: ProductStatus,
    enumName: 'ProductStatus',
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

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
