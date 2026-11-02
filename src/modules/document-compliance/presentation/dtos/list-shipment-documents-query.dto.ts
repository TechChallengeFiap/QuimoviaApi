import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ShipmentDocumentStatus } from '@/modules/document-compliance/domain/enums/shipment-document-status.enum.js';

@ValidatorConstraint({ name: 'safePaginationOffset', async: false })
class SafePaginationOffset implements ValidatorConstraintInterface {
  validate(page: number, args: ValidationArguments): boolean {
    const query = args.object as ListShipmentDocumentsQueryDto;
    return Number.isSafeInteger((page - 1) * (query.pageSize ?? 20));
  }

  defaultMessage(): string {
    return 'A página e o tamanho informados excedem o limite permitido de paginação.';
  }
}

export class ListShipmentDocumentsQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filtro pela carga.',
  })
  @IsOptional()
  @IsUUID('all', {
    message: 'O identificador da carga deve ser um UUID válido.',
  })
  shipmentId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filtro pelo embarcador.',
  })
  @IsOptional()
  @IsUUID('all', {
    message: 'O identificador do embarcador deve ser um UUID válido.',
  })
  shipperId?: string;

  @ApiPropertyOptional({
    type: String,
    enum: ShipmentDocumentStatus,
    description: 'Filtro pela situação documental.',
  })
  @IsOptional()
  @IsEnum(ShipmentDocumentStatus, {
    message: 'O status da documentação é inválido.',
  })
  status?: ShipmentDocumentStatus;

  @ApiPropertyOptional({
    type: Number,
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
  @Validate(SafePaginationOffset)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
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
