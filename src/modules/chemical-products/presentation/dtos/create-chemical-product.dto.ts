import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProductPhysicalState } from '@/modules/chemical-products/domain/enums/product-physical-state.enum.js';
import { ProductRiskClass } from '@/modules/chemical-products/domain/enums/product-risk-class.enum.js';
import { ProductStatus } from '@/modules/chemical-products/domain/enums/product-status.enum.js';
import { CreateProductDocumentDto } from './create-product-document.dto.js';

export class CreateChemicalProductDto {
  @ApiProperty({
    type: String,
    example: 'H2SO4-98',
    maxLength: 40,
    description: 'Código interno único do produto. É normalizado para maiúsculas.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ type: String, example: 'Ácido sulfúrico', minLength: 3, maxLength: 180 })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  technicalName!: string;

  @ApiPropertyOptional({ type: String, example: 'Sulfurax 98', maxLength: 180, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  tradeName?: string | null;

  @ApiProperty({ type: String, example: '1830', description: 'Número ONU: exatamente 4 dígitos.' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'unNumber deve conter exatamente 4 dígitos' })
  unNumber!: string;

  @ApiProperty({
    enum: ProductRiskClass,
    example: ProductRiskClass.CORROSIVE_SUBSTANCES,
  })
  @IsEnum(ProductRiskClass)
  riskClass!: ProductRiskClass;

  @ApiProperty({
    enum: ProductPhysicalState,
    example: ProductPhysicalState.LIQUID,
  })
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

  @ApiProperty({
    type: String,
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do usuário responsável pelo cadastro do produto. Deve existir.',
  })
  @IsString()
  @IsNotEmpty()
  responsibleUserId!: string;

  @ApiPropertyOptional({ type: [CreateProductDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDocumentDto)
  documents?: CreateProductDocumentDto[];
}
