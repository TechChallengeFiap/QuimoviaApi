import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateChemicalShipmentDTO {
  @ApiPropertyOptional({
    type: String,
    maxLength: 60,
    description:
      'Código identificador único da carga química (ex.: CARGO-2026-001). Se omitido, será gerado automaticamente.',
    example: 'CARGO-2026-001',
  })
  @IsOptional()
  @IsString({ message: 'O code deve ser uma string' })
  @MaxLength(60, { message: 'O code deve ter no máximo 60 caracteres' })
  code?: string;

  @ApiProperty({
    type: String,
    description: 'ID do produto químico associado',
    example: 'prod-001',
  })
  @IsString({ message: 'O productId deve ser uma string' })
  @IsNotEmpty({ message: 'O productId não pode estar vazio' })
  productId: string;

  @ApiProperty({
    type: Number,
    description: 'Quantidade de produto químico (deve ser maior que zero)',
    example: 100,
  })
  @IsNumber({}, { message: 'A quantidade do produto deve ser um número' })
  @IsNotEmpty({ message: 'A quantidade do produto não pode estar vazia' })
  @IsPositive({
    message: 'A quantidade do produto não pode ser 0 e nem negativa',
  })
  quantityProduct: number;

  @ApiPropertyOptional({
    type: String,
    maxLength: 20,
    description: 'Unidade de medida da carga (ex.: kg, toneladas, m³, L)',
    example: 'toneladas',
    default: 'kg',
  })
  @IsOptional()
  @IsString({ message: 'A unidade de medida (unit) deve ser uma string' })
  @MaxLength(20, {
    message: 'A unidade de medida (unit) deve ter no máximo 20 caracteres',
  })
  unit?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 120,
    description: 'Origem da carga / Porto ou terminal de embarque',
    example: 'Porto de Santos - Terminal Químico',
    default: 'Porto de Santos',
  })
  @IsOptional()
  @IsString({ message: 'A origem (origin) deve ser uma string' })
  @MaxLength(120, {
    message: 'A origem (origin) deve ter no máximo 120 caracteres',
  })
  origin?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 120,
    description: 'Destino da carga / Porto ou terminal de desembarque',
    example: 'Terminal Industrial Mauá',
    default: 'Terminal Portuário',
  })
  @IsOptional()
  @IsString({ message: 'O destino (destination) deve ser uma string' })
  @MaxLength(120, {
    message: 'O destino (destination) deve ter no máximo 120 caracteres',
  })
  destination?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description:
      'Data e hora de entrada no terminal portuário (ISO 8601). Se omitido, assume o momento atual.',
    example: '2026-10-24T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'A data de entrada (entryDate) deve ser uma data válida em formato ISO 8601',
    },
  )
  entryDate?: string;

  @ApiProperty({
    type: String,
    description: 'ID do usuário responsável técnico pela carga',
    example: 'user-001',
  })
  @IsString({ message: 'O responsibleUserId deve ser uma string' })
  @IsNotEmpty({ message: 'O responsibleUserId não pode estar vazio' })
  responsibleUserId: string;

  @ApiProperty({
    type: String,
    description: 'ID ou protocolo da documentação obrigatória anexada',
    example: 'doc-001',
  })
  @IsString({ message: 'O documentsIds deve ser uma string' })
  @IsNotEmpty({ message: 'O documentsIds não pode estar vazio' })
  documentsIds: string;
}
