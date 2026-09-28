import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProductPhysicalState } from '@/modules/produtos-quimicos/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/produtos-quimicos/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/produtos-quimicos/domain/enums/product-status.enum.js';
import { CreateProductDocumentDto } from './create-product-document.dto.js';

export class CreateChemicalProductDto {
  @ApiProperty({
    example: 'H2SO4-98',
    maxLength: 40,
    description: 'Código interno único do produto. É normalizado para maiúsculas.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: 'Ácido sulfúrico', minLength: 3, maxLength: 180 })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  technicalName!: string;

  @ApiPropertyOptional({ example: 'Sulfurax 98', maxLength: 180, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  tradeName?: string | null;

  @ApiProperty({ example: '1830', description: 'Número ONU: exatamente 4 dígitos.' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'unNumber deve conter exatamente 4 dígitos' })
  unNumber!: string;

  @ApiProperty({ enum: ProductRiskClass, example: ProductRiskClass.CORROSIVE_SUBSTANCES })
  @IsEnum(ProductRiskClass)
  riskClass!: ProductRiskClass;

  @ApiProperty({ enum: ProductPhysicalState, example: ProductPhysicalState.LIQUID })
  @IsEnum(ProductPhysicalState)
  physicalState!: ProductPhysicalState;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.UNDER_ANALYSIS,
    description: 'Status inicial do cadastro. Padrão: UNDER_ANALYSIS.',
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [CreateProductDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDocumentDto)
  documents?: CreateProductDocumentDto[];
}
