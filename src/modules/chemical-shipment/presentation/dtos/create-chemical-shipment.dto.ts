import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateChemicalShipmentDTO {
  @ApiPropertyOptional({
    type: String,
    description:
      'Código identificador único da carga química (ex.: CARGO-2026-001). Se omitido, será gerado automaticamente.',
    example: 'CARGO-2026-001',
  })
  @IsOptional()
  @IsString({ message: 'O code deve ser uma string' })
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
    description: 'Unidade de medida da carga (ex.: kg, toneladas, m³, L)',
    example: 'toneladas',
    default: 'kg',
  })
  @IsOptional()
  @IsString({ message: 'A unidade de medida (unit) deve ser uma string' })
  unit?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Origem da carga / Porto ou terminal de embarque',
    example: 'Porto de Santos - Terminal Químico',
    default: 'Porto de Santos',
  })
  @IsOptional()
  @IsString({ message: 'A origem (origin) deve ser uma string' })
  origin?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Destino da carga / Porto ou terminal de desembarque',
    example: 'Terminal Industrial Mauá',
    default: 'Terminal Portuário',
  })
  @IsOptional()
  @IsString({ message: 'O destino (destination) deve ser uma string' })
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
