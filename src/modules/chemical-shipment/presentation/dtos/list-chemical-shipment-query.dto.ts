import { ApiPropertyOptional } from "@nestjs/swagger";
import { StatusShipment } from "../../domain/value-objects/chemical-shipment/status-shipment.vo.ts";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListChemicalShipmentsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra as cargas químicas pelo status atual',
    enum: StatusShipment,
    enumName: 'StatusShipment',
    example: StatusShipment.ANALYZING,
  })
  @IsOptional()
  @IsEnum(StatusShipment)
  status?: StatusShipment;

  @ApiPropertyOptional({
    description: 'Filtra as cargas químicas pelo identificador do produto',
    type: String,
    example: 'prod-001',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filtra as cargas químicas pelo identificador do usuário responsável',
    type: String,
    example: 'user-001',
  })
  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @ApiPropertyOptional({
    description: 'Filtra as cargas químicas pelo identificador do documento anexado',
    type: String,
    example: 'doc-001',
  })
  @IsOptional()
  @IsString()
  documentsIds?: string;

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