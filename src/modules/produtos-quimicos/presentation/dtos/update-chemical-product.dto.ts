import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateChemicalProductDto } from './create-chemical-product.dto.js';

/**
 * Dados cadastrais que o Responsável Técnico pode alterar.
 *
 * Status e documentos têm endpoints próprios e por isso ficam de fora.
 */
export class UpdateChemicalProductDto extends PartialType(
  OmitType(CreateChemicalProductDto, ['status', 'documents'] as const),
) {
  @ApiProperty({ required: false, maxLength: 40 })
  declare code?: string;

  @ApiProperty({ required: false, minLength: 3, maxLength: 180 })
  declare technicalName?: string;

  @ApiProperty({ required: false, maxLength: 180, nullable: true })
  declare tradeName?: string | null;

  @ApiProperty({ required: false, description: 'Número ONU: exatamente 4 dígitos.' })
  declare unNumber?: string;
}
