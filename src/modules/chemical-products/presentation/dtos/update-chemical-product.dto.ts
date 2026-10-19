import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateChemicalProductDto } from './create-chemical-product.dto.js';

/**
 * Dados cadastrais que o Responsável Técnico pode alterar.
 *
 * Status e documentos têm endpoints próprios e por isso ficam de fora.
 */
export class UpdateChemicalProductDto extends PartialType(
  OmitType(CreateChemicalProductDto, ['status', 'documents'] as const),
) {
  @ApiPropertyOptional({
    type: String,
    maxLength: 40,
    example: 'H2SO4-98',
    description: 'Código interno único do produto. É normalizado para maiúsculas.',
  })
  declare code?: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 3,
    maxLength: 180,
    example: 'Ácido sulfúrico concentrado',
  })
  declare technicalName?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 180,
    nullable: true,
    example: 'Sulfurax 98',
    description: 'Envie null para remover o nome comercial.',
  })
  declare tradeName?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '1831',
    description: 'Número ONU: exatamente 4 dígitos.',
  })
  declare unNumber?: string;

  @ApiPropertyOptional({
    type: String,
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do novo usuário responsável pelo produto. Deve existir.',
  })
  declare responsibleUserId?: string;
}
