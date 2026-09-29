import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CargoDocumentStatus } from '@/modules/document-compliance/domain/enums/cargo-document-status.enum.js';

export class ListCargoDocumentsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtro pela carga.' })
  @IsOptional()
  @IsUUID('all', {
    message: 'O identificador da carga deve ser um UUID válido.',
  })
  cargoId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtro pelo embarcador.',
  })
  @IsOptional()
  @IsUUID('all', {
    message: 'O identificador do embarcador deve ser um UUID válido.',
  })
  shipperId?: string;

  @ApiPropertyOptional({
    enum: CargoDocumentStatus,
    description: 'Filtro pela situação documental.',
  })
  @IsOptional()
  @IsEnum(CargoDocumentStatus, {
    message: 'O status da documentação é inválido.',
  })
  status?: CargoDocumentStatus;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: Number.MAX_SAFE_INTEGER,
    default: 1,
    description: 'Página solicitada.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'A página excede o limite permitido.',
  })
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Quantidade de registros por página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O tamanho da página deve ser um número inteiro.' })
  @Min(1, { message: 'O tamanho da página deve ser maior ou igual a 1.' })
  @Max(100, { message: 'O tamanho da página deve ser menor ou igual a 100.' })
  pageSize?: number;
}
