import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';

export class CreateProductDocumentDto {
  @ApiProperty({
    enum: ProductDocumentType,
    example: ProductDocumentType.SAFETY_DATA_SHEET,
  })
  @IsEnum(ProductDocumentType, {
    message: 'O tipo do documento do produto é inválido.',
  })
  type!: ProductDocumentType;

  @ApiProperty({
    type: String,
    example: 'FISPQ-2026-0001',
    description: 'Número/identificação do documento',
    maxLength: 80,
  })
  @IsString({ message: 'O número do documento deve ser um texto.' })
  @IsNotEmpty({ message: 'O número do documento é obrigatório.' })
  @MaxLength(80, {
    message: 'O número do documento deve ter no máximo 80 caracteres.',
  })
  number!: string;

  @ApiPropertyOptional({
    type: Date,
    format: 'date-time',
    example: '2027-12-31T00:00:00.000Z',
    description: 'Data de validade. Omita para documentos sem validade.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate({ message: 'A validade do documento deve ser uma data válida.' })
  expiresAt?: Date | null;

  @ApiProperty({
    type: String,
    example: 'documentos/produtos/acido-sulfurico/fispq.pdf',
    maxLength: 500,
  })
  @IsString({ message: 'O caminho do arquivo deve ser um texto.' })
  @IsNotEmpty({ message: 'O caminho do arquivo é obrigatório.' })
  @MaxLength(500, {
    message: 'O caminho do arquivo deve ter no máximo 500 caracteres.',
  })
  filePath!: string;
}
