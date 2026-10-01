import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductDocumentType } from '@/modules/chemical-products/domain/enums/product-document-type.enum.js';

export class CreateProductDocumentDto {
  @ApiProperty({ enum: ProductDocumentType, example: ProductDocumentType.SAFETY_DATA_SHEET })
  @IsEnum(ProductDocumentType)
  type!: ProductDocumentType;

  @ApiProperty({ type: String, example: 'FISPQ-2026-0001', description: 'Número/identificação do documento' })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    type: Date,
    format: 'date-time',
    example: '2027-12-31T00:00:00.000Z',
    description: 'Data de validade. Omita para documentos sem validade.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({ type: String, example: 'documentos/produtos/acido-sulfurico/fispq.pdf' })
  @IsString()
  @IsNotEmpty()
  filePath!: string;
}
